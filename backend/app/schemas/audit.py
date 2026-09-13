# backend/app/schemas/audit.py
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class AuditEventResponse(BaseModel):
    id: UUID
    report_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    event_type: str
    action: str
    details: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class AuditListResponse(BaseModel):
    events: List[AuditEventResponse]
    total: int
    page: int
    page_size: int