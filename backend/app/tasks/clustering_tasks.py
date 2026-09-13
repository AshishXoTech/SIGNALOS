# backend/app/tasks/clustering_tasks.py
"""
Celery tasks for spatial clustering
"""
import asyncio
import logging
from datetime import datetime, timedelta
from app.tasks.celery_app import celery_app
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


def run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def periodic_clustering():
    """Run clustering periodically"""
    try:
        from app.services.clustering import clustering_engine

        async def _cluster():
            async with AsyncSessionLocal() as db:
                try:
                    result = await clustering_engine.run_clustering(db)
                    await db.commit()
                    return result
                except Exception as e:
                    await db.rollback()
                    raise

        result = run_async(_cluster())
        logger.info(f"🔄 Periodic clustering: {result}")
        return result

    except Exception as e:
        logger.error(f"❌ Clustering failed: {e}")
        return {"error": str(e)}


@celery_app.task
def cleanup_old_data():
    """Clean up old data"""
    logger.info("🧹 Starting data cleanup...")
    # Placeholder for cleanup logic
    return {"status": "completed"}