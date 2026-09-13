# backend/app/api/v1/verification.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.verification import VerificationLog
from app.schemas.verification import VerificationResponse, VerificationSummary
from app.services.ai_consensus import ai_engine

router = APIRouter()


@router.get("/logs", response_model=list[VerificationResponse])
async def list_verification_logs(
    report_id: Optional[UUID] = None,
    verdict: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get verification logs"""
    query = select(VerificationLog)

    if report_id:
        query = query.where(VerificationLog.report_id == report_id)
    if verdict:
        query = query.where(VerificationLog.verdict == verdict)

    query = query.order_by(desc(VerificationLog.created_at)).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [VerificationResponse.model_validate(log) for log in logs]


@router.get("/logs/{log_id}", response_model=VerificationResponse)
async def get_verification_log(
    log_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific verification log"""
    result = await db.execute(
        select(VerificationLog).where(VerificationLog.id == log_id)
    )
    log = result.scalar_one_or_none()

    if not log:
        raise HTTPException(status_code=404, detail="Verification log not found")

    return VerificationResponse.model_validate(log)


@router.get("/summary", response_model=VerificationSummary)
async def get_verification_summary(
    db: AsyncSession = Depends(get_db),
):
    """Get verification statistics summary"""
    from app.services.analytics_service import analytics_service

    stats = await analytics_service.get_verification_stats(db)

    verdict_dist = stats.get("verdict_distribution", {})

    return VerificationSummary(
        total_verified=verdict_dist.get("verified", 0),
        total_debunked=verdict_dist.get("debunked", 0),
        total_pending=verdict_dist.get("inconclusive", 0),
        average_trust_score=stats.get("average_trust_score", 0),
        average_processing_time_ms=stats.get("average_processing_time_ms", 0),
    )


@router.post("/verify/{report_id}", response_model=dict)
async def verify_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Run AI verification on a report"""
    from app.models.report import Report

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    verification_result = await ai_engine.verify_report(report_id, db, "manual")
    return verification_result