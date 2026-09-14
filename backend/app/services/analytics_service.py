# backend/app/services/analytics_service.py
"""
Analytics Service — Dashboard statistics and time-series data
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case, extract
from app.models.report import Report
from app.models.incident import Incident
from app.models.verification_log import VerificationLog
from app.models.user import User

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Generate analytics for the dashboard"""

    async def get_dashboard_stats(self, db: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive dashboard statistics"""

        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)

        # Total reports
        total_result = await db.execute(select(func.count(Report.id)))
        total_reports = total_result.scalar() or 0

        # Reports by status
        status_result = await db.execute(
            select(Report.status, func.count(Report.id))
            .group_by(Report.status)
        )
        status_counts = dict(status_result.all())

        verified = status_counts.get("verified", 0)
        debunked = status_counts.get("debunked", 0)
        pending = status_counts.get("pending", 0)

        # Reports today
        today_result = await db.execute(
            select(func.count(Report.id)).where(Report.created_at >= today_start)
        )
        reports_today = today_result.scalar() or 0

        # Reports this week
        week_result = await db.execute(
            select(func.count(Report.id)).where(Report.created_at >= week_start)
        )
        reports_this_week = week_result.scalar() or 0

        # Active incidents
        incident_result = await db.execute(
            select(func.count(Incident.id)).where(
                Incident.status.in_(["active", "monitoring"])
            )
        )
        active_incidents = incident_result.scalar() or 0

        # Average trust score
        avg_trust_result = await db.execute(
            select(func.avg(Report.trust_score)).where(Report.trust_score > 0)
        )
        avg_trust = avg_trust_result.scalar() or 0.0

        # Verification rate
        verification_rate = (verified / total_reports * 100) if total_reports > 0 else 0

        # Top disaster types
        type_result = await db.execute(
            select(Report.disaster_type, func.count(Report.id))
            .group_by(Report.disaster_type)
            .order_by(func.count(Report.id).desc())
            .limit(10)
        )
        top_types = [
            {"type": row[0], "count": row[1]}
            for row in type_result.all()
        ]

        # Severity distribution
        sev_result = await db.execute(
            select(Report.severity, func.count(Report.id))
            .group_by(Report.severity)
        )
        severity_dist = dict(sev_result.all())

        # Hourly trend (last 24 hours)
        hourly_trend = await self._get_hourly_trend(db, now)

        # Recent reports
        recent_result = await db.execute(
            select(Report)
            .order_by(Report.created_at.desc())
            .limit(10)
        )
        recent_reports = [
            {
                "id": str(r.id),
                "title": r.title,
                "disaster_type": r.disaster_type,
                "severity": r.severity,
                "status": r.status,
                "trust_score": r.trust_score,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "location_name": r.location_name,
                "created_at": r.created_at.isoformat(),
            }
            for r in recent_result.scalars().all()
        ]

        return {
            "total_reports": total_reports,
            "verified_reports": verified,
            "active_incidents": active_incidents,
            "average_trust_score": round(avg_trust, 1),
            "reports_today": reports_today,
            "reports_this_week": reports_this_week,
            "debunked_count": debunked,
            "pending_count": pending,
            "verification_rate": round(verification_rate, 1),
            "top_disaster_types": top_types,
            "severity_distribution": severity_dist,
            "hourly_trend": hourly_trend,
            "recent_reports": recent_reports,
        }

    async def _get_hourly_trend(
        self, db: AsyncSession, now: datetime
    ) -> List[Dict[str, Any]]:
        """Get report count per hour for the last 24 hours"""
        trend = []
        for i in range(24, 0, -1):
            hour_start = now - timedelta(hours=i)
            hour_end = now - timedelta(hours=i - 1)

            result = await db.execute(
                select(func.count(Report.id)).where(
                    and_(
                        Report.created_at >= hour_start,
                        Report.created_at < hour_end,
                    )
                )
            )
            count = result.scalar() or 0
            trend.append({
                "timestamp": hour_start.isoformat(),
                "hour": hour_start.strftime("%H:%M"),
                "count": count,
            })

        return trend

    async def get_geo_heatmap(
        self,
        db: AsyncSession,
        disaster_type: Optional[str] = None,
        hours: int = 168,  # 1 week default
    ) -> List[Dict[str, Any]]:
        """Get geographic heatmap data"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)

        query = select(
            Report.latitude,
            Report.longitude,
            Report.trust_score,
            Report.disaster_type,
            Report.severity,
        ).where(Report.created_at >= cutoff)

        if disaster_type:
            query = query.where(Report.disaster_type == disaster_type)

        result = await db.execute(query)
        points = result.all()

        return [
            {
                "latitude": p[0],
                "longitude": p[1],
                "intensity": p[2] or 50,
                "disaster_type": p[3],
                "severity": p[4],
            }
            for p in points
        ]

    async def get_time_series(
        self,
        db: AsyncSession,
        period: str = "week",
        disaster_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get time series data for charts"""
        if period == "day":
            hours = 24
            interval_hours = 1
        elif period == "week":
            hours = 168
            interval_hours = 6
        elif period == "month":
            hours = 720
            interval_hours = 24
        else:
            hours = 168
            interval_hours = 6

        now = datetime.utcnow()
        series = []

        for i in range(hours // interval_hours, 0, -1):
            start = now - timedelta(hours=i * interval_hours)
            end = now - timedelta(hours=(i - 1) * interval_hours)

            query = select(func.count(Report.id)).where(
                and_(
                    Report.created_at >= start,
                    Report.created_at < end,
                )
            )
            if disaster_type:
                query = query.where(Report.disaster_type == disaster_type)

            result = await db.execute(query)
            count = result.scalar() or 0

            series.append({
                "timestamp": start.isoformat(),
                "value": count,
                "label": start.strftime("%m/%d %H:%M"),
            })

        return series

    async def get_verification_stats(
        self, db: AsyncSession
    ) -> Dict[str, Any]:
        """Get verification performance metrics"""

        total = await db.execute(select(func.count(VerificationLog.id)))
        avg_time = await db.execute(
            select(func.avg(VerificationLog.processing_time_ms))
        )
        avg_score = await db.execute(
            select(func.avg(VerificationLog.final_trust_score))
        )

        verdict_counts = await db.execute(
            select(VerificationLog.verdict, func.count(VerificationLog.id))
            .group_by(VerificationLog.verdict)
        )

        return {
            "total_verifications": total.scalar() or 0,
            "average_processing_time_ms": round(avg_time.scalar() or 0, 2),
            "average_trust_score": round(avg_score.scalar() or 0, 2),
            "verdict_distribution": dict(verdict_counts.all()),
        }


# Singleton
analytics_service = AnalyticsService()