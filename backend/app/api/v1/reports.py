from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.report import Report
from app.models.verification_log import VerificationLog
from app.models.audit_event import AuditEvent
from app.schemas.report import ReportCreate, ReportResponse
from app.services.consensus_engine import consensus_engine
from app.core.websocket_manager import websocket_manager
from pydantic import BaseModel


class ReportReviewPayload(BaseModel):
    evidence_review: str
    review_notes: Optional[str] = None

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    disaster_str = payload.disaster_type.value if hasattr(payload.disaster_type, 'value') else str(payload.disaster_type)

    new_report = Report(
        user_id=payload.user_id,
        description=payload.description,
        disaster_type=disaster_str,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address_text=payload.address_text,
        image_url=payload.image_url,
        video_url=payload.video_url,
        audio_url=payload.audio_url,
        source=payload.source or "mobile",
        language=payload.language or "en",
        extra_metadata=payload.extra_metadata or {},
        status="verifying",
        location=func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326)
    )
    db.add(new_report)
    await db.flush()

    # Run AI Consensus Engine
    verification = await consensus_engine.verify_report(new_report, db)

    # Save verification log
    vlog = VerificationLog(
        report_id=new_report.id,
        vision_score=verification.vision_score,
        text_nlp_score=verification.text_nlp_score,
        geo_score=verification.geo_score,
        crowd_score=verification.crowd_score,
        weather_score=verification.weather_score,
        final_trust=verification.trust_score,
        vision_details=verification.vision_details,
        text_details=verification.text_details,
        geo_details=verification.geo_details,
        crowd_details=verification.crowd_details,
        weather_details=verification.weather_details,
        decision=verification.decision,
        confidence=verification.confidence
    )
    db.add(vlog)

    # Audit event
    audit = AuditEvent(
        event_type="report.created",
        entity_type="report",
        entity_id=new_report.id,
        actor=payload.user_id or "anonymous",
        action=f"Report submitted, trust={verification.trust_score}",
        details={"trust_score": verification.trust_score, "decision": verification.decision}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_report)

    # Broadcast to WebSocket
    background_tasks.add_task(websocket_manager.broadcast_report, new_report)

    return new_report


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    status_filter: Optional[str] = None,
    disaster_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Report).order_by(desc(Report.reported_at))
    if status_filter:
        query = query.where(Report.status == status_filter)
    if disaster_type:
        query = query.where(Report.disaster_type == disaster_type)
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{report_id}/reviews", response_model=ReportResponse)
async def review_report(
    report_id: UUID,
    payload: ReportReviewPayload,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    decision = payload.evidence_review.lower()
    if decision in {"confirmed", "verified", "approve", "approved"}:
        report.status = "verified"
    elif decision in {"disputed", "rejected", "false_alarm"}:
        report.status = "rejected"
    else:
        report.status = "verifying"

    await db.commit()
    await db.refresh(report)
    return report


@router.post("/batch-sync")
async def batch_sync_reports(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    reports = payload.get("reports", [])
    if not isinstance(reports, list):
        raise HTTPException(status_code=422, detail="reports must be a list")
    return {"accepted": len(reports), "reports": reports}


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/nearby/{lat}/{lng}", response_model=List[ReportResponse])
async def get_nearby_reports(
    lat: float, lng: float, radius_km: float = 5.0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Report).where(
        func.ST_DWithin(
            Report.location,
            func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326),
            radius_km * 1000
        )
    ).order_by(desc(Report.reported_at)).limit(50)
    result = await db.execute(query)
    return result.scalars().all()