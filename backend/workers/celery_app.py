"""
ViralCommerce AI — Celery Application
Configures the task queue with Redis broker and scheduled tasks.
"""
from celery import Celery
from celery.schedules import crontab
from backend.core.config import settings

app = Celery(
    "viralcommerce",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "backend.workers.crawler_worker",
        "backend.workers.supplier_worker",
        "backend.workers.campaign_worker",
        "backend.workers.score_worker",
    ],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,
)

# ─── Scheduled Tasks (Beat) ────────────────────────────────────
app.conf.beat_schedule = {
    # Crawl TikTok trending every 30 minutes
    "crawl-tiktok-trending": {
        "task": "backend.workers.crawler_worker.crawl_platform_task",
        "schedule": crontab(minute="*/30"),
        "args": [None, "tiktok", "trending", None],
    },
    # Crawl Instagram every hour
    "crawl-instagram-trending": {
        "task": "backend.workers.crawler_worker.crawl_platform_task",
        "schedule": crontab(minute=0),
        "args": [None, "instagram", "trending", None],
    },
    # Crawl YouTube Shorts every hour
    "crawl-youtube-shorts": {
        "task": "backend.workers.crawler_worker.crawl_platform_task",
        "schedule": crontab(minute=15),
        "args": [None, "youtube", "trending", None],
    },
    # Optimize all running campaigns every 6 hours
    "optimize-campaigns": {
        "task": "backend.workers.campaign_worker.optimize_all_campaigns_task",
        "schedule": crontab(minute=0, hour="*/6"),
    },
    # Update viral scores for tracked videos every 15 minutes
    "update-viral-scores": {
        "task": "backend.workers.score_worker.update_all_scores_task",
        "schedule": crontab(minute="*/15"),
    },
    # Scan viral hashtags every hour
    "scan-viral-hashtags": {
        "task": "backend.workers.crawler_worker.scan_hashtags_task",
        "schedule": crontab(minute=45),
    },
}
