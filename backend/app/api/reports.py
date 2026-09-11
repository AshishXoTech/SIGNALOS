"""
Reports API — Citizen report submission, manual verification trigger, and stats.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.database import get_session
from app.models import Report, VerificationLog, AuditEvent
from app.schemas import ReportResponse, ReportListResponse, StatsResponse, VerificationStep
from app.services.verify_service import run_full_verification
from app.services.cluster_service import run_clustering
from app.api.websocket import manager
from app.config import get_settings
from datetime import datetime
import os
import uuid
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reports", tags=["reports"])
settings = get_settings()


@router.post("/", response_model=ReportResponse, status_code=201)
async def submit_report(
    lat: float = Form(...),
    lng: float = Form(...),
    address: str = Form(""),
    description: str = Form(""),
    image: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    """
    Submit a new citizen crisis report.
    Saves image, triggers AI verification pipeline, updates incidents, and broadcasts via WebSocket.
    """
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(400, "Invalid GPS coordinates")

    image_path = ""
    if image and image.filename:
        os.makedirs(settings.upload_dir, exist_ok=True)
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        image_path = os.path.join(settings.upload_dir, filename)

        content = await image.read()
        if len(content) > settings.max_upload_size_mb * 1024 * 1024:
            raise HTTPException(413, "Image file too large")

        with open(image_path, "wb") as f:
            f.write(content)

    # 1. Create Report
    report = Report(
        lat=lat,
        lng=lng,
        address=address,
        description=description,
        image_path=image_path,
        status="received"
    )
    session.add(report)
    
    # Audit log
    audit = AuditEvent(
        event_type="REPORT_SUBMITTED",
        entity_id=report.id,
        details=json.dumps({"lat": lat, "lng": lng, "address": address})
    )
    session.add(audit)
    session.commit()
    session.refresh(report)

    # Broadcast "new_report" event via WebSocket
    await manager.broadcast("new_report", {
        "id": report.id,
        "lat": report.lat,
        "lng": report.lng,
        "status": report.status,
        "address": report.address
    })

    # 2. Run Verification Pipeline
    report = await run_full_verification(session, report)

    # 3. Run Clustering
    new_incidents = run_clustering(session)

    # Broadcast "verified" & "new_incident" event via WebSocket
    await manager.broadcast("verified", {
        "id": report.id,
        "lat": report.lat,
        "lng": report.lng,
        "status": report.status,
        "trust_score": report.trust_score,
        "verdict": report.verdict,
        "explanation": report.explanation,
        "category": report.detected_category
    })

    if new_incidents:
        for inc in new_incidents:
            await manager.broadcast("new_incident", {
                "id": inc.id,
                "title": inc.title,
                "center_lat": inc.center_lat,
                "center_lng": inc.center_lng,
                "severity": inc.severity
            })

    # Build verification proof chain steps
    logs = session.exec(
        select(VerificationLog)
        .where(VerificationLog.report_id == report.id)
        .order_by(VerificationLog.created_at)
    ).all()

    steps = []
    for log in logs:
        try:
            result_data = json.loads(log.result)
            score = result_data.get("vision_score", result_data.get("urgency_score", result_data.get("geo_score", result_data.get("crowd_score", result_data.get("satellite_score", 0)))))
            detail = result_data.get("detail", log.step)
            steps.append(VerificationStep(step_name=log.step, score=score, detail=detail))
        except Exception:
            steps.append(VerificationStep(step_name=log.step, score=0, detail=log.result[:100]))

    return ReportResponse(
        id=report.id,
        lat=report.lat,
        lng=report.lng,
        address=report.address,
        description=report.description,
        image_path=report.image_path,
        status=report.status,
        trust_score=report.trust_score,
        verdict=report.verdict,
        explanation=report.explanation,
        detected_category=report.detected_category,
        incident_id=report.incident_id,
        created_at=report.created_at,
        verified_at=report.verified_at,
        verification_steps=steps
    )


@router.post("/{report_id}/verify", response_model=ReportResponse)
async def trigger_report_verification(
    report_id: str,
    session: Session = Depends(get_session)
):
    """
    Task 1.2 Explicit Route: Manually re-trigger AI verification for an existing report.
    """
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Report not found")

    report = await run_full_verification(session, report)
    run_clustering(session)

    # Broadcast updated state
    await manager.broadcast("verified", {
        "id": report.id,
        "trust_score": report.trust_score,
        "status": report.status,
        "verdict": report.verdict
    })

    return ReportResponse.model_validate(report)


@router.get("/", response_model=ReportListResponse)
def list_reports(
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session)
):
    """Get all reports, optionally filtered by status."""
    statement = select(Report).order_by(Report.created_at.desc())
    if status:
        statement = statement.where(Report.status == status)

    reports = session.exec(statement.offset(offset).limit(limit)).all()
    total = len(session.exec(select(Report)).all())

    return ReportListResponse(
        total=total,
        reports=[ReportResponse.model_validate(r) for r in reports]
    )


@router.get("/stats", response_model=StatsResponse)
def get_stats(session: Session = Depends(get_session)):
    """Live situation statistics for the command dashboard."""
    from app.models import Incident

    all_reports = session.exec(select(Report)).all()
    status_counts = {}
    for r in all_reports:
        status_counts[r.status] = status_counts.get(r.status, 0) + 1

    active_incidents = len(session.exec(
        select(Incident).where(Incident.status == "active")
    ).all())

    latest = all_reports[0].created_at if all_reports else None

    return StatsResponse(
        total_reports=len(all_reports),
        received=status_counts.get("received", 0),
        verifying=status_counts.get("verifying", 0),
        verified=status_counts.get("verified", 0),
        likely=status_counts.get("likely", 0),
        needs_review=status_counts.get("needs_review", 0),
        unverified=status_counts.get("unverified", 0),
        active_incidents=active_incidents,
        latest_report_time=latest
    )