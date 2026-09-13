from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


class DisasterTypeEnum(str, Enum):
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    FIRE = "fire"
    LANDSLIDE = "landslide"
    CYCLONE = "cyclone"
    TSUNAMI = "tsunami"
    DROUGHT = "drought"
    OTHER = "other"


class ReportStatusEnum(str, Enum):
    PENDING = "pending"
    VERIFYING = "verifying"
    VERIFIED = "verified"
    REJECTED = "rejected"
    DUPLICATE = "duplicate"


class ReportCreate(BaseModel):
    user_id: Optional[str] = Field(default="anonymous", max_length=255)
    description: str = Field(..., min_length=5)
    disaster_type: DisasterTypeEnum = Field(default=DisasterTypeEnum.OTHER)

    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address_text: Optional[str] = Field(default=None)

    image_url: Optional[str] = Field(default=None)
    video_url: Optional[str] = Field(default=None)
    audio_url: Optional[str] = Field(default=None)

    source: Optional[str] = Field(default="mobile")
    language: Optional[str] = Field(default="en")
    extra_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[str] = None
    description: str
    disaster_type: str

    image_url: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None

    latitude: float
    longitude: float
    address_text: Optional[str] = None

    reported_at: Optional[datetime] = None
    event_time: Optional[datetime] = None

    vision_score: float = 0.0
    text_nlp_score: float = 0.0
    geo_score: float = 0.0
    crowd_score: float = 0.0
    weather_score: float = 0.0
    trust_score: float = 0.0

    status: str
    incident_id: Optional[UUID] = None

    source: Optional[str] = "mobile"
    language: Optional[str] = "en"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None