"""
Incidents API — Clustered crisis incidents for the map.
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models import Incident
from app.schemas import IncidentResponse, IncidentListResponse

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("/", response_model=IncidentListResponse)
def list_incidents(
    status: str = "active",
    session: Session = Depends(get_session)
):
    """Get all incidents, default to active only."""
    statement = (
        select(Incident)
        .where(Incident.status == status)
        .order_by(Incident.updated_at.desc())
    )
    incidents = session.exec(statement).all()

    return IncidentListResponse(
        total=len(incidents),
        incidents=[
            IncidentResponse.model_validate(i) for i in incidents
        ]
    )