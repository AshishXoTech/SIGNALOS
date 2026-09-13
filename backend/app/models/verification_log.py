import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)

    vision_score = Column(Float, nullable=True)
    text_nlp_score = Column(Float, nullable=True)
    geo_score = Column(Float, nullable=True)
    crowd_score = Column(Float, nullable=True)
    weather_score = Column(Float, nullable=True)
    final_trust = Column(Float, nullable=False)

    vision_details = Column(JSONB, default={})
    text_details = Column(JSONB, default={})
    geo_details = Column(JSONB, default={})
    crowd_details = Column(JSONB, default={})
    weather_details = Column(JSONB, default={})

    decision = Column(String(50), nullable=False)  # 'verified', 'rejected', 'needs_review'
    confidence = Column(Float, nullable=True)

    verified_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    report = relationship("Report", back_populates="verification_logs")