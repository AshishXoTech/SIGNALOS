# backend/app/api/v1/alerts.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.alert import Alert, AlertSubscription
from app.models.user import User
from app.schemas.alert import (
    AlertCreate, AlertResponse,
    AlertSubscriptionCreate, AlertSubscriptionResponse,
)
from app.dependencies import get_current_user, get_current_user_optional
from app.core.websocket_manager import ws_manager
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    disaster_type: Optional[str] = None,
    is_active: bool = True,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get alerts"""
    query = select(Alert).where(Alert.is_active == is_active)

    if disaster_type:
        query = query.where(Alert.disaster_type == disaster_type)

    query = query.order_by(desc(Alert.created_at)).limit(limit)

    result = await db.execute(query)
    alerts = result.scalars().all()

    return [AlertResponse.model_validate(a) for a in alerts]


@router.post("/", response_model=AlertResponse, status_code=201)
async def create_alert(
    data: AlertCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a manual alert"""
    alert = Alert(
        title=data.title,
        message=data.message,
        alert_type=data.alert_type,
        disaster_type=data.disaster_type,
        severity=data.severity,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_km=data.radius_km,
        incident_id=data.incident_id,
    )

    db.add(alert)
    await db.flush()
    await db.refresh(alert)

    # Broadcast
    await ws_manager.broadcast_to_all({
        "type": "alert",
        "data": {
            "id": str(alert.id),
            "title": alert.title,
            "message": alert.message,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
        },
        "timestamp": datetime.utcnow().isoformat(),
    })

    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Dismiss an alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_active = False
    return {"status": "dismissed"}


@router.post("/subscribe", response_model=AlertSubscriptionResponse, status_code=201)
async def create_subscription(
    data: AlertSubscriptionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Subscribe to alerts"""
    sub = AlertSubscription(
        user_id=user.id,
        disaster_types=data.disaster_types,
        min_severity=data.min_severity,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_km=data.radius_km,
        email_enabled=data.email_enabled,
        push_enabled=data.push_enabled,
    )

    db.add(sub)
    await db.flush()
    await db.refresh(sub)

    return AlertSubscriptionResponse.model_validate(sub)