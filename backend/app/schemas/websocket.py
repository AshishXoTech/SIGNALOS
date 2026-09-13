# backend/app/schemas/websocket.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class WSMessage(BaseModel):
    type: str  # new_report, verification_update, incident_update, alert, stats_update
    data: Dict[str, Any]
    timestamp: datetime = None

    def __init__(self, **data):
        if "timestamp" not in data or data["timestamp"] is None:
            data["timestamp"] = datetime.utcnow()
        super().__init__(**data)


class WSSubscription(BaseModel):
    channels: list[str] = ["all"]
    # channels: all, reports, incidents, alerts, analytics
    disaster_types: list[str] = []
    region: Optional[Dict[str, float]] = None  # lat, lng, radius_km