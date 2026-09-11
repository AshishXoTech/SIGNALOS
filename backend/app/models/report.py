from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional
import uuid


def utc_now() -> datetime:
    """Helper for timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class Report(SQLModel, table=True):
    """Citizen crisis report — the raw input from the field."""
    __tablename__ = "reports"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36
    )
    lat: float = Field(index=True)
    lng: float = Field(index=True)
    address: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=2000)
    image_path: str = Field(default="", max_length=500)

    # Verification fields (populated by AI pipeline)
    status: str = Field(
        default="received",
        index=True
    )  # received | verifying | verified | likely | needs_review | unverified

    trust_score: float = Field(default=0.0)

    # Individual evidence scores (0-100 each)
    vision_score: float = Field(default=0.0)
    text_score: float = Field(default=0.0)
    geo_score: float = Field(default=0.0)
    crowd_score: float = Field(default=0.0)
    satellite_score: float = Field(default=0.0)

    # AI explanation
    verdict: str = Field(default="pending", max_length=50)
    explanation: str = Field(default="", max_length=1000)
    detected_category: str = Field(default="unknown", max_length=100)

    # Link to incident (set after clustering)
    incident_id: Optional[str] = Field(default=None, foreign_key="incidents.id")

    # Timestamps
    created_at: datetime = Field(default_factory=utc_now)
    verified_at: Optional[datetime] = Field(default=None)


class VerificationLog(SQLModel, table=True):
    """Audit trail for every verification decision."""
    __tablename__ = "verification_logs"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36
    )
    report_id: str = Field(foreign_key="reports.id", index=True)
    step: str = Field(max_length=100)  # e.g., "vision_analysis", "consensus_fusion"
    result: str = Field(max_length=2000)  # JSON string of step result
    created_at: datetime = Field(default_factory=utc_now)


class AuditEvent(SQLModel, table=True):
    """Audit log for system-wide security & operational events."""
    __tablename__ = "audit_events"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        max_length=36
    )
    event_type: str = Field(index=True, max_length=100)
    entity_id: str = Field(index=True, max_length=36)
    actor: str = Field(default="system", max_length=100)
    details: str = Field(default="{}", max_length=2000)
    created_at: datetime = Field(default_factory=utc_now)