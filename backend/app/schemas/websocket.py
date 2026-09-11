from pydantic import BaseModel
from typing import Any, Optional


class WSEvent(BaseModel):
    """Standard WebSocket event envelope."""
    event: str  # new_report | verifying | verified | new_incident | stats_update
    data: dict = {}
    timestamp: Optional[str] = None