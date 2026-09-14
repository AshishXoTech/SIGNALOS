from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse
from app.models.report import Report
from app.models.audit_event import AuditEvent
from pydantic import BaseModel


class IncidentCreatePayload(BaseModel):
    title: str
    description: Optional[str] = None
    disaster_type: str
    severity: str = "medium"
    latitude: float
    longitude: float


class LinkReportPayload(BaseModel):
    report_id: UUID
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


@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(payload: IncidentCreatePayload, db: AsyncSession = Depends(get_db)):
    incident = Incident(
        title=payload.title,
        description=payload.description,
        disaster_type=payload.disaster_type,
        severity=payload.severity,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location=func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326),
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return incident


@router.get("/{incident_id}/timeline")
async def incident_timeline(incident_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditEvent)
        .where(AuditEvent.entity_type == "incident", AuditEvent.entity_id == incident_id)
        .order_by(AuditEvent.created_at)
    )
    return result.scalars().all()


@router.post("/{incident_id}/reports")
async def link_report(incident_id: UUID, payload: LinkReportPayload, db: AsyncSession = Depends(get_db)):
    incident_result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = incident_result.scalar_one_or_none()
    report_result = await db.execute(select(Report).where(Report.id == payload.report_id))
    report = report_result.scalar_one_or_none()
    if not incident or not report:
        raise HTTPException(status_code=404, detail="Incident or report not found")
    report.incident_id = incident.id
    incident.report_count = (incident.report_count or 0) + 1
    await db.commit()
    return {"incident_id": str(incident.id), "report_id": str(report.id)}


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