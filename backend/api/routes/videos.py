"""
Videos API — access crawled viral videos and their metrics
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.video import Video, TrendScore

router = APIRouter()


@router.get("/")
async def list_videos(
    platform: Optional[str] = None,
    hashtag: Optional[str] = None,
    min_views: int = Query(0, ge=0),
    min_viral_score: float = Query(0, ge=0, le=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Video).where(
        Video.viral_score >= min_viral_score,
        Video.views >= min_views,
    )
    if platform:
        query = query.where(Video.platform == platform)
    if hashtag:
        query = query.where(Video.hashtags.contains([hashtag]))

    videos = await db.scalars(
        query.order_by(desc(Video.viral_score))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return videos.all()


@router.get("/viral")
async def get_viral_videos(
    limit: int = Query(20, ge=1, le=100),
    platform: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get currently viral videos above threshold."""
    from backend.core.config import settings
    query = select(Video).where(Video.viral_score >= settings.VIRAL_SCORE_THRESHOLD)
    if platform:
        query = query.where(Video.platform == platform)
    result = await db.scalars(query.order_by(desc(Video.viral_score)).limit(limit))
    return result.all()


@router.get("/{video_id}")
async def get_video(video_id: UUID, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/{video_id}/score-history")
async def score_history(video_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(TrendScore)
        .where(TrendScore.video_id == video_id)
        .order_by(desc(TrendScore.recorded_at))
        .limit(100)
    )
    return result.all()
