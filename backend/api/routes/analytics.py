"""
Analytics API — dashboard KPIs and performance reports
"""
from fastapi import APIRouter, Query

from backend.core.database import get_clickhouse

router = APIRouter()


@router.get("/overview")
async def dashboard_overview():
    """Main dashboard KPIs."""
    ch = get_clickhouse()

    # Aggregate from ClickHouse
    viral_products = ch.execute(
        "SELECT count() FROM product_trend_events WHERE event_time >= now() - INTERVAL 24 HOUR AND viral_score >= 70"
    )[0][0]

    videos_today = ch.execute(
        "SELECT sum(videos_crawled) FROM crawler_stats WHERE event_time >= today()"
    )[0][0]

    top_platform = ch.execute(
        """
        SELECT platform, sum(videos_crawled) AS cnt
        FROM crawler_stats
        WHERE event_time >= now() - INTERVAL 24 HOUR
        GROUP BY platform
        ORDER BY cnt DESC
        LIMIT 1
        """
    )

    return {
        "viral_products_24h": viral_products,
        "videos_crawled_today": videos_today,
        "top_platform": top_platform[0][0] if top_platform else None,
    }


@router.get("/platform-stats")
async def platform_stats(hours: int = Query(24, ge=1, le=720)):
    """Per-platform crawl statistics."""
    ch = get_clickhouse()
    rows = ch.execute(
        """
        SELECT
            platform,
            sum(videos_crawled) AS videos,
            sum(products_found) AS products,
            sum(errors)         AS errors
        FROM crawler_stats
        WHERE event_time >= now() - INTERVAL %(hours)s HOUR
        GROUP BY platform
        ORDER BY videos DESC
        """,
        {"hours": hours},
    )
    return [
        {"platform": r[0], "videos": r[1], "products": r[2], "errors": r[3]}
        for r in rows
    ]


@router.get("/viral-timeline")
async def viral_timeline(
    hours: int = Query(24, ge=1, le=168),
    interval: str = Query("hour", enum=["hour", "day"]),
):
    """Viral score distribution over time."""
    ch = get_clickhouse()
    trunc_fn = "toStartOfHour" if interval == "hour" else "toStartOfDay"
    rows = ch.execute(
        f"""
        SELECT
            {trunc_fn}(event_time) AS bucket,
            avg(viral_score)       AS avg_score,
            count()                AS data_points
        FROM product_trend_events
        WHERE event_time >= now() - INTERVAL %(hours)s HOUR
        GROUP BY bucket
        ORDER BY bucket
        """,
        {"hours": hours},
    )
    return [{"time": r[0], "avg_viral_score": r[1], "count": r[2]} for r in rows]


@router.get("/category-breakdown")
async def category_breakdown(hours: int = Query(24)):
    """Product category distribution."""
    ch = get_clickhouse()
    rows = ch.execute(
        """
        SELECT
            category,
            count()          AS product_count,
            avg(viral_score) AS avg_viral_score
        FROM product_trend_events
        WHERE event_time >= now() - INTERVAL %(hours)s HOUR
        GROUP BY category
        ORDER BY product_count DESC
        LIMIT 20
        """,
        {"hours": hours},
    )
    return [
        {"category": r[0], "count": r[1], "avg_viral_score": r[2]}
        for r in rows
    ]


@router.get("/ad-performance-summary")
async def ad_performance_summary():
    """Overall ad performance across all campaigns."""
    ch = get_clickhouse()
    rows = ch.execute(
        """
        SELECT
            network,
            sum(impressions)  AS impressions,
            sum(clicks)       AS clicks,
            sum(conversions)  AS conversions,
            sum(spend)        AS spend,
            sum(revenue)      AS revenue,
            avg(roas)         AS avg_roas
        FROM ad_performance_events
        WHERE event_time >= now() - INTERVAL 30 DAY
        GROUP BY network
        """
    )
    return [
        {
            "network": r[0], "impressions": r[1], "clicks": r[2],
            "conversions": r[3], "spend": float(r[4]),
            "revenue": float(r[5]), "avg_roas": float(r[6]),
        }
        for r in rows
    ]
