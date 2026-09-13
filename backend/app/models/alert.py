# backend/app/models/alert.py
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, Text, Boolean, Integer, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"), nullable=True)

    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(50), nullable=False)  # warning, critical, info, update
    disaster_type = Column(String(100), nullable=True)
    severity = Column(String(20), default="medium")

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius_km = Column(Float, default=50.0)

    # Status
    is_active = Column(Boolean, default=True)
    sent_count = Column(Integer, default=0)
    acknowledged_count = Column(Integer, default=0)

    # Metadata
    metadata_extra = Column(JSONB, default={})
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    incident = relationship("Incident", back_populates="alerts")

    def __repr__(self):
        return f"<Alert {self.alert_type} — {self.title}>"


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Filters
    disaster_types = Column(ARRAY(String), default=[])
    min_severity = Column(String(20), default="medium")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius_km = Column(Float, default=100.0)

    # Channels
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="alert_subscriptions")