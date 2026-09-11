from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class IncidentResponse(BaseModel):
    """Incident cluster data for the map + panel."""
    id: str
    title: str
    summary: str
    category: str
    center_lat: float
    center_lng: float
    report_count: int
    avg_trust_score: float
    severity: str
    affected_radius_meters: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    """All active incidents."""
    total: int
    incidents: List[IncidentResponse]