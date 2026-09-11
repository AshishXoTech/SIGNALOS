from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid


class Incident(SQLModel, table=True):
    """Auto-formed incident cluster from verified reports."""
    __tablename__ = "incidents"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36
    )
    title: str = Field(default="Unverified Incident", max_length=300)
    summary: str = Field(default="", max_length=1000)
    category: str = Field(default="unknown", max_length=100)

    # Cluster center (average of all report coordinates)
    center_lat: float = Field(default=0.0)
    center_lng: float = Field(default=0.0)

    # Cluster metrics
    report_count: int = Field(default=0)
    avg_trust_score: float = Field(default=0.0)
    severity: str = Field(default="moderate", max_length=50)  # low|moderate|high|critical

    # Affected area estimate
    affected_radius_meters: float = Field(default=0.0)

    # Status
    status: str = Field(default="active", index=True)  # active | resolved | monitoring

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)