# backend/app/services/notification_service.py
"""
Notification Service — Alert dispatching
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.alert import Alert, AlertSubscription
from app.models.incident import Incident
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)


class NotificationService:
    """Handle alert creation and broadcasting"""

    async def create_alert_for_incident(
        self,
        incident: Incident,
        db: AsyncSession,
    ) -> Alert:
        """Auto-create an alert for a new/updated incident"""

        alert = Alert(
            incident_id=incident.id,
            title=f"⚠️ {incident.disaster_type.replace('_', ' ').title()} Alert",
            message=(
                f"{incident.title}. {incident.report_count} reports received. "
                f"Confidence: {incident.confidence_score:.0f}%"
            ),
            alert_type="critical" if incident.severity == "critical" else "warning",
            disaster_type=incident.disaster_type,
            severity=incident.severity,
            latitude=incident.latitude,
            longitude=incident.longitude,
            radius_km=incident.radius_km * 2,
        )

        db.add(alert)
        await db.flush()

        # Broadcast alert
        await ws_manager.broadcast_to_all({
            "type": "alert",
            "data": {
                "id": str(alert.id),
                "title": alert.title,
                "message": alert.message,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "disaster_type": alert.disaster_type,
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "incident_id": str(incident.id),
            },
            "timestamp": datetime.utcnow().isoformat(),
        })

        return alert

    async def get_active_alerts(
        self,
        db: AsyncSession,
        disaster_type: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> List[Alert]:
        """Get active alerts, optionally filtered"""

        query = select(Alert).where(Alert.is_active == True)

        if disaster_type:
            query = query.where(Alert.disaster_type == disaster_type)

        query = query.order_by(Alert.created_at.desc()).limit(50)
        result = await db.execute(query)
        return result.scalars().all()


# Singleton
notification_service = NotificationService()