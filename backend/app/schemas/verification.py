from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class VerificationResult(BaseModel):
    report_id: UUID
    vision_score: float = Field(..., ge=0.0, le=100.0)
    text_nlp_score: float = Field(..., ge=0.0, le=100.0)
    geo_score: float = Field(..., ge=0.0, le=100.0)
    crowd_score: float = Field(..., ge=0.0, le=100.0)
    weather_score: float = Field(..., ge=0.0, le=100.0)
    
    trust_score: float = Field(..., ge=0.0, le=100.0)
    decision: str  # 'verified', 'rejected', 'needs_review'
    confidence: float
    
    vision_details: Dict[str, Any] = {}
    text_details: Dict[str, Any] = {}
    geo_details: Dict[str, Any] = {}
    crowd_details: Dict[str, Any] = {}
    weather_details: Dict[str, Any] = {}
    
    verified_at: datetime = Field(default_factory=datetime.utcnow)


class VerificationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    report_id: UUID
    vision_score: Optional[float] = None
    text_nlp_score: Optional[float] = None
    geo_score: Optional[float] = None
    crowd_score: Optional[float] = None
    weather_score: Optional[float] = None
    final_trust: float
    decision: str
    confidence: Optional[float] = None
    verified_at: datetime


class VerificationSummary(BaseModel):
    total_verified: int
    total_debunked: int
    total_pending: int
    average_trust_score: float
    average_processing_time_ms: float