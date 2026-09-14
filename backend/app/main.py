import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_v1_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("signal_os")

app = FastAPI(
    title="Signal OS — AI Disaster Intelligence Platform",
    description="Multi-modal AI verification + real-time spatial disaster coordination",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)


@app.get("/")
async def root():
    return {
        "system": "Signal OS Disaster Intelligence API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "/ws/live",
        "api_base": "/api/v1"
    }


@app.on_event("startup")
async def startup():
    logger.info("🚀 Signal OS Backend LIVE")
    logger.info(f"🌍 Environment: {settings.APP_ENV}")
    logger.info(f"📡 WebSocket: ws://localhost:8001/ws/live")
    logger.info(f"📖 Docs: http://localhost:8001/docs")


@app.on_event("shutdown")
async def shutdown():
    logger.info("🛑 Signal OS Backend shutting down")