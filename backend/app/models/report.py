import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, cast
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, foreign
from geoalchemy2 import Geography

from app.database import Base


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFYING = "verifying"
    VERIFIED = "verified"
    REJECTED = "rejected"
    DUPLICATE = "duplicate"


class DisasterType(str, enum.Enum):
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    FIRE = "fire"
    LANDSLIDE = "landslide"
    CYCLONE = "cyclone"
    TSUNAMI = "tsunami"
    DROUGHT = "drought"
    OTHER = "other"


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    disaster_type = Column(String(50), default="other", nullable=False)

    image_url = Column(String(1024), nullable=True)
    video_url = Column(String(1024), nullable=True)
    audio_url = Column(String(1024), nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography("POINT", srid=4326), nullable=False)
    address_text = Column(String(500), nullable=True)

    reported_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    event_time = Column(DateTime(timezone=True), nullable=True)

    vision_score = Column(Float, default=0.0)
    text_nlp_score = Column(Float, default=0.0)
    geo_score = Column(Float, default=0.0)
    crowd_score = Column(Float, default=0.0)
    weather_score = Column(Float, default=0.0)
    trust_score = Column(Float, default=0.0)

    status = Column(String(50), default="pending", nullable=False)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)

    source = Column(String(50), default="mobile")
    language = Column(String(10), default="en")
    extra_metadata = Column("metadata", JSONB, default={})

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    incident = relationship("Incident", back_populates="reports")
    reporter = relationship(
        "User",
        back_populates="reports",
        primaryjoin="foreign(Report.user_id) == cast(User.id, String)",
        viewonly=True,
    )
    verification_logs = relationship("VerificationLog", back_populates="report", cascade="all, delete-orphan")