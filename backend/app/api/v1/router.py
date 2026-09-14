from fastapi import APIRouter
from app.api.v1 import (
    health,
    reports,
    incidents,
    websocket,
    users,
    analytics,
    media,
    alerts,
    verification,
)

api_v1_router = APIRouter()

# Mount v1 REST routes under /api/v1
api_v1_router.include_router(health.router, prefix="/api/v1")
api_v1_router.include_router(reports.router, prefix="/api/v1")
api_v1_router.include_router(incidents.router, prefix="/api/v1")
api_v1_router.include_router(users.router, prefix="/api/v1/auth")
api_v1_router.include_router(analytics.router, prefix="/api/v1/analytics")
api_v1_router.include_router(media.router, prefix="/api/v1/media")
api_v1_router.include_router(alerts.router, prefix="/api/v1/alerts")
api_v1_router.include_router(verification.router, prefix="/api/v1/verification")

# WebSocket is mounted at root (no /api/v1 prefix)
api_v1_router.include_router(websocket.router)