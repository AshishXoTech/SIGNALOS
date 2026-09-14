from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    team_id: str = Field(..., min_length=1, max_length=100)
    team_name: str = Field(..., min_length=1, max_length=255)
    responder_id: Optional[UUID] = None
    notes: Optional[str] = None


class AssignmentTransition(BaseModel):
    new_status: str = Field(..., pattern="^(offered|accepted|en_route|on_scene|resolving|completed|declined)$")
    reason: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: UUID
    incident_id: UUID
    team_id: str
    team_name: str
    responder_id: Optional[UUID] = None
    status: str
    notes: Optional[str] = None
    offered_at: datetime
    accepted_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class ClosureCreate(BaseModel):
    assignment_id: Optional[UUID] = None
    actions_taken: str = Field(..., min_length=10)
    people_assisted: int = Field(default=0, ge=0)
    remaining_risks: Optional[str] = None


class ClosureReview(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected|needs_info)$")
    review_notes: Optional[str] = None


class ClosureResponse(BaseModel):
    id: UUID
    incident_id: UUID
    assignment_id: Optional[UUID] = None
    submitted_by: str
    actions_taken: str
    people_assisted: int
    remaining_risks: Optional[str] = None
    status: str
    review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
