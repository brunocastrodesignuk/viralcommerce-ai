"""
Crawler Worker — Celery tasks for triggering Scrapy crawls
"""
import logging
import subprocess
import sys
from datetime import datetime, timezone

from backend.workers.celery_app import app

log = logging.getLogger(__name__)

VIRAL_HASHTAGS = [
    "tiktokmademebuyit", "amazonfinds", "viralproducts",
    "productfinds", "tiktokshop", "aliexpressfinds",
    "musthaveproducts", "worthit", "coolproducts",
]


@app.task(bind=True, max_retries=3, name="backend.workers.crawler_worker.crawl_platform_task")
def crawl_platform_task(self, job_id: str, platform: str, job_type: str, target: str | None):
    """
    Celery task that triggers a Scrapy spider for the given platform.
    Updates CrawlerJob status in PostgreSQL.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from backend.core.config import settings
    from backend.models.crawler_job import CrawlerJob

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            if job_id:
                from uuid import UUID
                job = await db.get(CrawlerJob, UUID(job_id))
                if job:
                    job.status = "running"
                    job.started_at = datetime.now(timezone.utc)
                    await db.commit()

            try:
                spider_map = {
                    "tiktok": "tiktok",
                    "instagram": "instagram",
                    "youtube": "youtube",
                    "pinterest": "pinterest",
                    "amazon": "amazon",
                }
                spider_name = spider_map.get(platform, platform)

                result = subprocess.run(
                    [sys.executable, "-m", "scrapy", "crawl", spider_name],
                    capture_output=True,
                    text=True,
                    timeout=600,
                )

                if job_id:
                    job = await db.get(CrawlerJob, UUID(job_id))
                    if job:
                        job.status = "completed" if result.returncode == 0 else "failed"
                        job.finished_at = datetime.now(timezone.utc)
                        if result.returncode != 0:
                            job.error_msg = result.stderr[:500]
                        await db.commit()

            except Exception as exc:
                log.error(f"Crawler task failed: {exc}")
                raise self.retry(exc=exc, countdown=60)
            finally:
                await engine.dispose()

    asyncio.run(_run())


@app.task(name="backend.workers.crawler_worker.scan_hashtags_task")
def scan_hashtags_task():
    """Trigger hashtag scans across all tracked hashtags."""
    for hashtag in VIRAL_HASHTAGS:
        for platform in ["tiktok", "instagram"]:
            crawl_platform_task.delay(None, platform, "hashtag_scan", hashtag)
    log.info(f"Queued hashtag scans for {len(VIRAL_HASHTAGS)} hashtags")
