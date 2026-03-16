"""
Crawler API — trigger and monitor crawl jobs
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.crawler_job import CrawlerJob

router = APIRouter()

PLATFORM_CHOICES = ["tiktok", "instagram", "youtube", "pinterest", "amazon", "temu", "aliexpress"]


@router.post("/jobs/start")
async def start_crawl_job(
    platform: str,
    job_type: str = "trending",
    target: str = None,
    db: AsyncSession = Depends(get_db),
):
    """Queue a new crawl job."""
    from backend.workers.crawler_worker import crawl_platform_task
    job = CrawlerJob(platform=platform, job_type=job_type, target=target)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    # Send to Celery
    crawl_platform_task.delay(str(job.id), platform, job_type, target)
    return {"job_id": job.id, "status": "queued"}


@router.get("/jobs")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(CrawlerJob).order_by(desc(CrawlerJob.created_at)).limit(50)
    )
    return result.all()


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    job = await db.get(CrawlerJob, UUID(job_id))
    if not job:
        from fastapi import HTTPException
        raise HTTPException(404, "Job not found")
    return job


@router.post("/hashtag-scan")
async def scan_hashtag(
    hashtag: str,
    platforms: list[str] = ["tiktok", "instagram"],
    db: AsyncSession = Depends(get_db),
):
    """Trigger hashtag scan across multiple platforms."""
    jobs = []
    for platform in platforms:
        job = CrawlerJob(platform=platform, job_type="hashtag_scan", target=hashtag)
        db.add(job)
        jobs.append(job)
    await db.commit()
    return {"jobs": [{"id": str(j.id), "platform": j.platform} for j in jobs]}


@router.get("/stats")
async def crawler_stats():
    """Real-time crawler statistics from ClickHouse."""
    from backend.core.database import get_clickhouse
    ch = get_clickhouse()
    rows = ch.execute(
        """
        SELECT
            platform,
            sum(videos_crawled) AS videos_crawled,
            sum(products_found) AS products_found,
            sum(errors)         AS errors,
            avg(duration_ms)    AS avg_duration_ms
        FROM crawler_stats
        WHERE event_time >= now() - INTERVAL 1 HOUR
        GROUP BY platform
        ORDER BY videos_crawled DESC
        """
    )
    return [
        {
            "platform": r[0], "videos_crawled": r[1],
            "products_found": r[2], "errors": r[3],
            "avg_duration_ms": round(r[4], 1),
        }
        for r in rows
    ]
