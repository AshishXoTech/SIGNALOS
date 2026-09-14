import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Float, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geography

from app.database import Base


class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, enum.Enum):
    ACTIVE = "active"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    disaster_type = Column(String(50), nullable=False)
    severity = Column(String(50), default="medium", nullable=False)
    status = Column(String(50), default="active", nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography("POINT", srid=4326), nullable=False)
    radius_meters = Column(Float, default=1000.0)

    report_count = Column(Integer, default=0)
    avg_trust_score = Column(Float, default=0.0)

    first_reported = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    cluster_id = Column(String(100), nullable=True)
    dbscan_params = Column(JSONB, default={})

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    reports = relationship("Report", back_populates="incident")
    alerts = relationship("Alert", back_populates="incident")