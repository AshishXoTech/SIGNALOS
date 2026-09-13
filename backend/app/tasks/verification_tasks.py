# backend/app/tasks/verification_tasks.py
"""
Celery tasks for async verification
"""
import asyncio
import logging
from app.tasks.celery_app import celery_app
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery"""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def verify_report_task(self, report_id: str, triggered_by: str = "auto"):
    """Async task to verify a report"""
    try:
        from app.services.ai_consensus import ai_engine
        from uuid import UUID

        async def _verify():
            async with AsyncSessionLocal() as db:
                try:
                    result = await ai_engine.verify_report(
                        UUID(report_id), db, triggered_by
                    )
                    await db.commit()
                    return result
                except Exception as e:
                    await db.rollback()
                    raise

        result = run_async(_verify())
        logger.info(f"✅ Verification task completed for {report_id}")
        return result

    except Exception as exc:
        logger.error(f"❌ Verification task failed for {report_id}: {exc}")
        raise self.retry(exc=exc)