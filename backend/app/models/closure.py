import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Closure(Base):
    __tablename__ = "closures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    submitted_by = Column(String(255), nullable=False, default="system")
    actions_taken = Column(Text, nullable=False)
    people_assisted = Column(Integer, nullable=False, default=0)
    remaining_risks = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
