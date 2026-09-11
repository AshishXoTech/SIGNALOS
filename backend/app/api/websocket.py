"""
WebSocket Engine — Real-time live updates to all connected dashboards.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages all active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            f"WS connected. Total: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(
            f"WS disconnected. Total: {len(self.active_connections)}"
        )

    async def broadcast(self, event: str, data: dict):
        """Send event to ALL connected clients."""
        message = json.dumps({
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception:
                disconnected.append(conn)

        # Clean up dead connections
        for conn in disconnected:
            self.disconnect(conn)


# Global manager instance (imported by other modules)
manager = ConnectionManager()


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    Main WebSocket endpoint.
    Frontend connects here to receive real-time updates.

    Events broadcast:
    - new_report: Citizen submitted a report
    - verifying: AI is checking a report
    - verified: Report passed verification
    - new_incident: Reports clustered into new incident
    - stats_update: Dashboard stats changed
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            # Client can send ping or subscribe to specific areas
            if data == "ping":
                await websocket.send_text(json.dumps({
                    "event": "pong",
                    "data": {},
                    "timestamp": datetime.utcnow().isoformat()
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)