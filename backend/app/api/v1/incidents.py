from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse
from app.services.cluster_service import cluster_service
from app.core.websocket_manager import websocket_manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    query = select(Incident).order_by(desc(Incident.last_updated))
    if status_filter:
        query = query.where(Incident.status == status_filter)
    if severity:
        query = query.where(Incident.severity == severity)
    result = await db.execute(query.limit(limit))
    return result.scalars().all()


@router.get("/stats/summary")
async def stats_summary(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Incident.id)))).scalar() or 0
    active = (await db.execute(select(func.count(Incident.id)).where(Incident.status == "active"))).scalar() or 0
    critical = (await db.execute(select(func.count(Incident.id)).where(Incident.severity == "critical"))).scalar() or 0
    return {
        "total_incidents": total,
        "active_incidents": active,
        "critical_incidents": critical
    }


@router.post("/cluster/run")
async def run_clustering(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    incidents = await cluster_service.cluster_verified_reports(db)
    for inc in incidents:
        background_tasks.add_task(websocket_manager.broadcast_incident, inc)
    return {
        "clustered_incidents": len(incidents),
        "incident_ids": [str(i.id) for i in incidents]
    }


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident