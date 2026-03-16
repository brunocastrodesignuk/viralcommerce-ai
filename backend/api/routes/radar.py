"""
Trend Radar API — Returns AI-computed hashtag trends, clusters, and emerging signals.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.hashtag import Hashtag

router = APIRouter(prefix="/radar", tags=["Trend Radar"])


@router.get("/report")
async def get_radar_report(
    hours: int = Query(24, ge=1, le=168, description="Lookback window in hours"),
    platform: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Full trend radar report: top trends, emerging signals, clusters.
    Pulls live hashtag data from PostgreSQL and runs TrendRadarAnalyzer.
    """
    from ai.trend_radar.analyzer import TrendRadarAnalyzer, HashtagSnapshot, build_radar_report

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    stmt = select(Hashtag).where(Hashtag.updated_at >= cutoff)
    if platform:
        stmt = stmt.where(Hashtag.platform == platform)
    stmt = stmt.order_by(Hashtag.trend_velocity.desc()).limit(200)

    hashtags = (await db.execute(stmt)).scalars().all()

    # Build snapshot dict — one snapshot per hashtag (we use current state)
    # In production you'd store time-series snapshots in ClickHouse
    snapshots_by_tag = {}
    for ht in hashtags:
        snap = HashtagSnapshot(
            tag=ht.tag,
            platform=ht.platform or "unknown",
            post_count=int(ht.post_count or 0),
            timestamp=ht.updated_at or datetime.now(timezone.utc),
        )
        # Fake a prior snapshot using trend_velocity to back-calculate
        velocity = float(ht.trend_velocity or 0)
        prior_count = max(0, int(ht.post_count or 0) - int(velocity * hours))
        prior_snap = HashtagSnapshot(
            tag=ht.tag,
            platform=ht.platform or "unknown",
            post_count=prior_count,
            timestamp=(ht.updated_at or datetime.now(timezone.utc)) - timedelta(hours=hours),
        )
        snapshots_by_tag[ht.tag] = [prior_snap, snap]

    report = build_radar_report(snapshots_by_tag)
    return report


@router.get("/emerging")
async def get_emerging_trends(
    limit: int = Query(10, ge=1, le=50),
    platform: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return only the fastest-accelerating emerging hashtags."""
    from ai.trend_radar.analyzer import TrendRadarAnalyzer, HashtagSnapshot

    stmt = (
        select(Hashtag)
        .where(Hashtag.is_tracked == True)
        .order_by(Hashtag.trend_velocity.desc())
        .limit(100)
    )
    if platform:
        stmt = stmt.where(Hashtag.platform == platform)

    hashtags = (await db.execute(stmt)).scalars().all()

    analyzer = TrendRadarAnalyzer()
    snapshots_by_tag = {}
    for ht in hashtags:
        velocity = float(ht.trend_velocity or 0)
        now = datetime.now(timezone.utc)
        snapshots_by_tag[ht.tag] = [
            HashtagSnapshot(tag=ht.tag, platform=ht.platform or "unknown",
                            post_count=max(0, int((ht.post_count or 0) - velocity * 24)),
                            timestamp=now - timedelta(hours=24)),
            HashtagSnapshot(tag=ht.tag, platform=ht.platform or "unknown",
                            post_count=int(ht.post_count or 0),
                            timestamp=now),
        ]

    signals = analyzer.batch_analyze(snapshots_by_tag)
    emerging = analyzer.detect_emerging(signals, top_n=limit)

    return [
        {
            "tag": s.tag,
            "platform": s.platform,
            "acceleration": round(s.acceleration, 2),
            "velocity": round(s.velocity, 1),
            "post_count": s.post_count,
            "trend_score": round(s.trend_score, 1),
        }
        for s in emerging
    ]


@router.get("/clusters")
async def get_trend_clusters(
    platform: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return thematic clusters of trending hashtags."""
    from ai.trend_radar.analyzer import TrendRadarAnalyzer, HashtagSnapshot

    stmt = (
        select(Hashtag)
        .order_by(Hashtag.trend_velocity.desc())
        .limit(150)
    )
    if platform:
        stmt = stmt.where(Hashtag.platform == platform)
    hashtags = (await db.execute(stmt)).scalars().all()

    analyzer = TrendRadarAnalyzer()
    now = datetime.now(timezone.utc)
    snapshots_by_tag = {}
    for ht in hashtags:
        velocity = float(ht.trend_velocity or 0)
        snapshots_by_tag[ht.tag] = [
            HashtagSnapshot(tag=ht.tag, platform=ht.platform or "unknown",
                            post_count=max(0, int((ht.post_count or 0) - velocity * 24)),
                            timestamp=now - timedelta(hours=24)),
            HashtagSnapshot(tag=ht.tag, platform=ht.platform or "unknown",
                            post_count=int(ht.post_count or 0), timestamp=now),
        ]

    signals = analyzer.batch_analyze(snapshots_by_tag)
    clusters = analyzer.cluster_trends(signals)

    return [
        {
            "theme": c.theme,
            "dominant_tag": c.dominant_tag,
            "tags": c.tags,
            "peak_score": round(c.peak_trend_score, 1),
            "platforms": c.platform_distribution,
        }
        for c in clusters[:15]
    ]
