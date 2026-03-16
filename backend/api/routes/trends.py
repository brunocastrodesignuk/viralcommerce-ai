"""
Trend Radar API — hashtag monitoring and trend analysis
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.hashtag import Hashtag

router = APIRouter()

TRACKED_HASHTAGS = [
    "#TikTokMadeMeBuyIt",
    "#AmazonFinds",
    "#ViralProducts",
    "#ProductFinds",
    "#TikTokShop",
    "#AliExpressFinds",
    "#UnderRatedProducts",
    "#MustHaveProducts",
    "#WorthIt",
    "#CoolProducts",
]


@router.get("/hashtags")
async def list_hashtags(
    platform: Optional[str] = None,
    is_tracked: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(Hashtag)
    if platform:
        query = query.where(Hashtag.platform == platform)
    if is_tracked is not None:
        query = query.where(Hashtag.is_tracked == is_tracked)
    result = await db.scalars(
        query.order_by(desc(Hashtag.trend_velocity)).limit(limit)
    )
    return result.all()


@router.get("/hashtags/top")
async def top_hashtags(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Top trending hashtags by velocity."""
    result = await db.scalars(
        select(Hashtag)
        .order_by(desc(Hashtag.trend_velocity))
        .limit(limit)
    )
    return result.all()


@router.post("/hashtags/track")
async def track_hashtag(
    tag: str,
    platform: str = "tiktok",
    db: AsyncSession = Depends(get_db),
):
    """Add a hashtag to tracking list."""
    existing = await db.scalar(select(Hashtag).where(Hashtag.tag == tag))
    if existing:
        existing.is_tracked = True
    else:
        hashtag = Hashtag(tag=tag, platform=platform, is_tracked=True)
        db.add(hashtag)
    await db.commit()
    return {"tag": tag, "tracked": True}


@router.get("/hashtag-velocity")
async def hashtag_velocity(hours: int = Query(24, ge=1, le=168)):
    """Get hashtag growth velocity from ClickHouse."""
    from backend.core.database import get_clickhouse
    ch = get_clickhouse()
    rows = ch.execute(
        """
        SELECT
            hashtag,
            platform,
            max(post_count)           AS current_count,
            sum(post_count_delta)     AS total_growth,
            avg(trend_velocity)       AS avg_velocity
        FROM hashtag_trend_events
        WHERE event_time >= now() - INTERVAL %(hours)s HOUR
        GROUP BY hashtag, platform
        ORDER BY avg_velocity DESC
        LIMIT 50
        """,
        {"hours": hours},
    )
    return [
        {"hashtag": r[0], "platform": r[1], "count": r[2], "growth": r[3], "velocity": r[4]}
        for r in rows
    ]


@router.get("/default-hashtags")
async def default_hashtags():
    """Return the default tracked hashtags."""
    return {"hashtags": TRACKED_HASHTAGS}
