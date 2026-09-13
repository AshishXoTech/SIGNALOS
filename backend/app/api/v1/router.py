from fastapi import APIRouter
from app.api.v1 import health, reports, incidents, websocket

api_v1_router = APIRouter()

# Mount v1 REST routes under /api/v1
api_v1_router.include_router(health.router, prefix="/api/v1")
api_v1_router.include_router(reports.router, prefix="/api/v1")
api_v1_router.include_router(incidents.router, prefix="/api/v1")

# WebSocket is mounted at root (no /api/v1 prefix)
api_v1_router.include_router(websocket.router)