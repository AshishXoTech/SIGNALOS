"""
SIGNAL OS — Main Application Entry Point
Real-Time Verified Crisis Intelligence Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from app.database import create_db_and_tables
from app.api import reports, incidents, websocket
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 SIGNAL OS starting up...")
    logger.info(f"   Environment: {settings.app_env}")
    logger.info(f"   AI Mode: {'Gemini' if settings.gemini_api_key else 'Fallback'}")

    # Create database tables
    create_db_and_tables()
    logger.info("   ✅ Database ready")

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    logger.info("   ✅ Upload directory ready")

    logger.info("🟢 SIGNAL OS is LIVE")
    yield
    logger.info("🔴 SIGNAL OS shutting down")


# Create FastAPI app
app = FastAPI(
    title="SIGNAL OS",
    description="Real-Time Verified Crisis Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://127.0.0.1:3000",
        "*",  # For hackathon demo flexibility
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded images
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Register routers
app.include_router(reports.router)
app.include_router(incidents.router)
app.include_router(websocket.router)


@app.get("/")
def root():
    """Health check."""
    return {
        "platform": "SIGNAL OS",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    """Detailed health check for monitoring."""
    return {
        "status": "healthy",
        "ai_mode": "gemini" if settings.gemini_api_key else "fallback",
        "database": "connected"
    }