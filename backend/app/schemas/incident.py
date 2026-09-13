from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class IncidentSeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatusEnum(str, Enum):
    ACTIVE = "active"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str] = None
    disaster_type: str
    severity: str
    status: str

    latitude: float
    longitude: float
    radius_meters: float = 1000.0

    report_count: int = 0
    avg_trust_score: float = 0.0

    first_reported: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    cluster_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None