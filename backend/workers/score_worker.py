"""
Score Worker — Celery tasks for viral score computation and updates
"""
import logging
from datetime import datetime, timezone, timedelta

from backend.workers.celery_app import app

log = logging.getLogger(__name__)


@app.task(bind=True, max_retries=2, name="backend.workers.score_worker.update_video_score_task")
def update_video_score_task(self, video_id: str):
    """
    Fetch latest metrics for a video and recompute its viral score.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from backend.core.config import settings
    from backend.models.video import Video, TrendScore

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                from uuid import UUID
                video = await db.get(Video, UUID(video_id))
                if not video:
                    return

                from ai.virality.scorer import ViralityScorer, VideoSnapshot
                scorer = ViralityScorer()

                # Build current snapshot
                current = VideoSnapshot(
                    video_id=video_id,
                    platform=video.platform,
                    views=int(video.view_count or 0),
                    likes=int(video.like_count or 0),
                    comments=int(video.comment_count or 0),
                    shares=int(video.share_count or 0),
                    timestamp=datetime.now(timezone.utc),
                )

                # Get previous TrendScore as prior snapshot
                from sqlalchemy import select
                stmt = (
                    select(TrendScore)
                    .where(TrendScore.video_id == video.id)
                    .order_by(TrendScore.recorded_at.desc())
                    .limit(1)
                )
                prev_score = (await db.execute(stmt)).scalar_one_or_none()

                prev_snapshot = None
                if prev_score:
                    prev_snapshot = VideoSnapshot(
                        video_id=video_id,
                        platform=video.platform,
                        views=int(prev_score.views_at_record or 0),
                        likes=0,
                        comments=0,
                        shares=0,
                        timestamp=prev_score.recorded_at,
                    )

                result = scorer.score_single(current, prev_snapshot)

                # Save new TrendScore
                trend = TrendScore(
                    video_id=video.id,
                    viral_score=result.viral_score,
                    views_growth=result.views_growth,
                    shares_ratio=result.shares_ratio,
                    comments_growth=result.comments_growth,
                    like_ratio=result.like_ratio,
                    velocity=result.velocity,
                    views_at_record=current.views,
                )
                db.add(trend)

                # Update video's current viral score
                video.viral_score = result.viral_score
                video.updated_at = datetime.now(timezone.utc)

                await db.commit()

                if result.viral_score >= 70:
                    log.info(
                        f"🔥 VIRAL: video={video_id} platform={video.platform} "
                        f"score={result.viral_score:.1f}"
                    )

            except Exception as exc:
                log.error(f"Score update failed for video {video_id}: {exc}")
                raise self.retry(exc=exc, countdown=60)
            finally:
                await engine.dispose()

    asyncio.run(_run())


@app.task(name="backend.workers.score_worker.update_all_scores_task")
def update_all_scores_task():
    """
    Beat task: Update viral scores for all recently active videos every 15 minutes.
    Only processes videos that have been active in the last 72 hours.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import select
    from backend.core.config import settings
    from backend.models.video import Video

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                cutoff = datetime.now(timezone.utc) - timedelta(hours=72)
                stmt = (
                    select(Video)
                    .where(Video.updated_at >= cutoff)
                    .order_by(Video.viral_score.desc())
                    .limit(500)  # Process top 500 per cycle
                )
                videos = (await db.execute(stmt)).scalars().all()

                for video in videos:
                    update_video_score_task.delay(str(video.id))

                log.info(f"Queued score updates for {len(videos)} videos")
            finally:
                await engine.dispose()

    asyncio.run(_run())


@app.task(name="backend.workers.score_worker.update_product_scores_task")
def update_product_scores_task():
    """
    Aggregate viral scores from detected videos to update product-level scores.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import select, func
    from backend.core.config import settings
    from backend.models.product import Product
    from backend.models.video import Video

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                products = (await db.execute(select(Product))).scalars().all()
                updated = 0

                for product in products:
                    if not product.source_video_ids:
                        continue

                    # Fetch max viral score across source videos
                    from uuid import UUID
                    video_ids = [UUID(vid) for vid in product.source_video_ids if vid]
                    if not video_ids:
                        continue

                    stmt = select(func.max(Video.viral_score)).where(
                        Video.id.in_(video_ids)
                    )
                    max_score = (await db.execute(stmt)).scalar_one_or_none()

                    if max_score is not None:
                        product.viral_score = float(max_score)
                        updated += 1

                await db.commit()
                log.info(f"Updated viral scores for {updated} products")
            finally:
                await engine.dispose()

    asyncio.run(_run())
