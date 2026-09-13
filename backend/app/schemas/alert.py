# backend/app/schemas/alert.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class AlertCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    message: str = Field(..., min_length=10)
    alert_type: str = "warning"
    disaster_type: Optional[str] = None
    severity: str = "medium"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: float = 50.0
    incident_id: Optional[UUID] = None


class AlertResponse(BaseModel):
    id: UUID
    incident_id: Optional[UUID] = None
    title: str
    message: str
    alert_type: str
    disaster_type: Optional[str] = None
    severity: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: float
    is_active: bool
    sent_count: int
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlertSubscriptionCreate(BaseModel):
    disaster_types: List[str] = []
    min_severity: str = "medium"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: float = 100.0
    email_enabled: bool = True
    push_enabled: bool = True


class AlertSubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    disaster_types: List[str] = []
    min_severity: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: float
    email_enabled: bool
    push_enabled: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True