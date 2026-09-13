# backend/app/services/report_service.py
"""
Report Service — Core business logic for report operations
"""
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from app.models.report import Report
from app.models.audit import AuditEvent
from app.models.user import User
from app.schemas.report import ReportCreate, ReportUpdate
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)


class ReportService:
    """Business logic for report CRUD and queries"""

    async def create_report(
        self,
        data: ReportCreate,
        db: AsyncSession,
        user: Optional[User] = None,
    ) -> Report:
        """Create a new report"""

        report = Report(
            title=data.title,
            description=data.description,
            disaster_type=data.disaster_type.value,
            severity=data.severity.value,
            latitude=data.latitude,
            longitude=data.longitude,
            location_name=data.location_name,
            location_detail=data.location_detail,
            media_urls=data.media_urls,
            tags=data.tags,
            source=data.source,
            source_url=data.source_url,
            is_anonymous=data.is_anonymous,
            reported_at=data.reported_at or datetime.utcnow(),
            reporter_id=user.id if user and not data.is_anonymous else None,
            reporter_name=user.username if user and not data.is_anonymous else None,
            status="pending",
        )

        db.add(report)
        await db.flush()
        await db.refresh(report)

        # Update user stats
        if user:
            user.total_reports += 1

        # Audit event
        audit = AuditEvent(
            report_id=report.id,
            user_id=user.id if user else None,
            event_type="report_created",
            action=f"Report '{report.title}' created",
            details={
                "disaster_type": report.disaster_type,
                "severity": report.severity,
                "location": f"{report.latitude}, {report.longitude}",
            },
        )
        db.add(audit)

        # Broadcast new report
        await ws_manager.broadcast_to_all({
            "type": "new_report",
            "data": {
                "id": str(report.id),
                "title": report.title,
                "disaster_type": report.disaster_type,
                "severity": report.severity,
                "latitude": report.latitude,
                "longitude": report.longitude,
                "location_name": report.location_name,
                "status": report.status,
                "trust_score": report.trust_score,
                "created_at": report.created_at.isoformat(),
            },
            "timestamp": datetime.utcnow().isoformat(),
        })

        logger.info(f"📝 Report created: {report.id} — {report.title}")
        return report

    async def get_report(
        self, report_id: UUID, db: AsyncSession
    ) -> Optional[Report]:
        result = await db.execute(
            select(Report).where(Report.id == report_id)
        )
        report = result.scalar_one_or_none()
        if report:
            report.view_count += 1
        return report

    async def list_reports(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        disaster_type: Optional[str] = None,
        severity: Optional[str] = None,
        min_trust_score: Optional[float] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        radius_km: Optional[float] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Report], int]:
        """List reports with filters"""

        query = select(Report)
        count_query = select(func.count(Report.id))

        # Apply filters
        conditions = []
        if status:
            conditions.append(Report.status == status)
        if disaster_type:
            conditions.append(Report.disaster_type == disaster_type)
        if severity:
            conditions.append(Report.severity == severity)
        if min_trust_score is not None:
            conditions.append(Report.trust_score >= min_trust_score)
        if search:
            conditions.append(
                or_(
                    Report.title.ilike(f"%{search}%"),
                    Report.description.ilike(f"%{search}%"),
                    Report.location_name.ilike(f"%{search}%"),
                )
            )
        if lat is not None and lon is not None and radius_km:
            delta = radius_km / 111.0
            conditions.append(Report.latitude.between(lat - delta, lat + delta))
            conditions.append(Report.longitude.between(lon - delta, lon + delta))

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sort
        sort_column = getattr(Report, sort_by, Report.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute
        result = await db.execute(query)
        reports = result.scalars().all()

        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        return reports, total

    async def update_report(
        self,
        report_id: UUID,
        data: ReportUpdate,
        db: AsyncSession,
    ) -> Optional[Report]:
        result = await db.execute(
            select(Report).where(Report.id == report_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(report, key, value)

        report.updated_at = datetime.utcnow()
        return report

    async def vote_report(
        self,
        report_id: UUID,
        vote_type: str,
        db: AsyncSession,
        user: Optional[User] = None,
    ) -> Optional[Report]:
        result = await db.execute(
            select(Report).where(Report.id == report_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            return None

        if vote_type == "upvote":
            report.upvotes += 1
        else:
            report.downvotes += 1

        # Audit
        audit = AuditEvent(
            report_id=report.id,
            user_id=user.id if user else None,
            event_type="user_vote",
            action=f"{vote_type} on report {report_id}",
            details={"vote_type": vote_type},
        )
        db.add(audit)

        return report

    async def delete_report(
        self, report_id: UUID, db: AsyncSession
    ) -> bool:
        result = await db.execute(
            select(Report).where(Report.id == report_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            return False
        await db.delete(report)
        return True


# Singleton
report_service = ReportService()