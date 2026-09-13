from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import websocket_manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/live")
async def live_websocket(websocket: WebSocket):
    """Real-time streaming of reports and incidents to the frontend."""
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception:
        websocket_manager.disconnect(websocket)