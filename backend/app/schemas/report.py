from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ── Request Schemas ──

class ReportCreate(BaseModel):
    """What the citizen PWA sends (excluding image, which is FormData)."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=2000)


# ── Response Schemas ──

class VerificationStep(BaseModel):
    """Single step in the verification proof chain."""
    step_name: str
    score: float
    detail: str


class ReportResponse(BaseModel):
    """Full report data returned to frontend."""
    id: str
    lat: float
    lng: float
    address: str
    description: str
    image_path: str
    status: str
    trust_score: float
    verdict: str
    explanation: str
    detected_category: str
    incident_id: Optional[str] = None
    created_at: datetime
    verified_at: Optional[datetime] = None

    # Proof chain for explainability
    verification_steps: Optional[List[VerificationStep]] = None

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    """Paginated list of reports."""
    total: int
    reports: List[ReportResponse]


class StatsResponse(BaseModel):
    """Live situation statistics for dashboard."""
    total_reports: int
    received: int
    verifying: int
    verified: int
    likely: int
    needs_review: int
    unverified: int
    active_incidents: int
    latest_report_time: Optional[datetime] = None