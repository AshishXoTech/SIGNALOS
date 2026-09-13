# backend/app/models/user.py
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Text, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="reporter", nullable=False)  # reporter, verifier, admin
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    reputation_score = Column(Integer, default=50)  # 0-100
    total_reports = Column(Integer, default=0)
    verified_reports = Column(Integer, default=0)
    avatar_url = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    reports = relationship("Report", back_populates="reporter", lazy="dynamic")
    alert_subscriptions = relationship("AlertSubscription", back_populates="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"