import logging
from typing import Set
from fastapi import WebSocket
from datetime import datetime

logger = logging.getLogger("signal_os.websocket")


class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        await websocket.send_json({
            "event": "connection.established",
            "message": "Connected to Signal OS Live Feed",
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"✅ WebSocket connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"❌ WebSocket disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, event: str, data: dict):
        message = {
            "event": event,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        dead = set()
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception as e:
                logger.warning(f"WS send failed: {e}")
                dead.add(conn)
        for d in dead:
            self.active_connections.discard(d)

    async def broadcast_report(self, report):
        try:
            await self.broadcast("report.new", {
                "id": str(report.id),
                "description": report.description,
                "disaster_type": report.disaster_type.value if hasattr(report.disaster_type, "value") else str(report.disaster_type),
                "latitude": report.latitude,
                "longitude": report.longitude,
                "trust_score": report.trust_score,
                "status": report.status.value if hasattr(report.status, "value") else str(report.status),
                "reported_at": report.reported_at.isoformat() if report.reported_at else None
            })
        except Exception as e:
            logger.error(f"broadcast_report failed: {e}")

    async def broadcast_incident(self, incident):
        try:
            await self.broadcast("incident.new", {
                "id": str(incident.id),
                "title": incident.title,
                "severity": incident.severity.value if hasattr(incident.severity, "value") else str(incident.severity),
                "status": incident.status.value if hasattr(incident.status, "value") else str(incident.status),
                "latitude": incident.latitude,
                "longitude": incident.longitude,
                "report_count": incident.report_count,
                "avg_trust_score": incident.avg_trust_score
            })
        except Exception as e:
            logger.error(f"broadcast_incident failed: {e}")


websocket_manager = WebSocketManager()