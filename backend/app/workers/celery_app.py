"""Celery application and beat schedule."""
from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "ai_lead_hunter",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Periodic jobs: monitoring drift + follow-up generation
celery_app.conf.beat_schedule = {
    "monitor-companies-hourly": {
        "task": "app.workers.tasks.monitor_companies",
        "schedule": 3600.0,
    },
    "generate-followups-daily": {
        "task": "app.workers.tasks.generate_followups",
        "schedule": 86400.0,
    },
}
