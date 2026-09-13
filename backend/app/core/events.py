# backend/app/core/events.py
import logging
from app.database import engine, Base

logger = logging.getLogger(__name__)


async def startup_event():
    """Run on application startup"""
    logger.info("🚀 TruScan AI Backend starting up...")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("✅ Database tables verified/created")
    logger.info("✅ TruScan AI Backend ready")


async def shutdown_event():
    """Run on application shutdown"""
    logger.info("🛑 TruScan AI Backend shutting down...")
    await engine.dispose()
    logger.info("✅ Database connections closed")