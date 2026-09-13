# backend/app/tasks/celery_app.py
from celery import Celery
from celery.schedules import crontab
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "truscan",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.verification_tasks",
        "app.tasks.clustering_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)

# Periodic tasks
celery_app.conf.beat_schedule = {
    "run-clustering-every-5-minutes": {
        "task": "app.tasks.clustering_tasks.periodic_clustering",
        "schedule": 300.0,  # every 5 minutes
    },
    "cleanup-old-reports-daily": {
        "task": "app.tasks.clustering_tasks.cleanup_old_data",
        "schedule": crontab(hour=3, minute=0),  # 3 AM daily
    },
}