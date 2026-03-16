-- ============================================================
-- ViralCommerce AI — ClickHouse Analytics Schema
-- High-performance time-series analytics
-- ============================================================

-- ─── VIDEO METRICS (append-only time-series) ────────────────
CREATE TABLE IF NOT EXISTS video_metrics (
    event_time      DateTime,
    video_id        String,
    platform        LowCardinality(String),
    views           UInt64,
    likes           UInt64,
    shares          UInt64,
    comments        UInt64,
    viral_score     Float32,
    views_delta     Int64,     -- change since last snapshot
    likes_delta     Int64,
    shares_delta    Int64
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (platform, video_id, event_time)
TTL event_time + INTERVAL 6 MONTH;

-- ─── PRODUCT TREND EVENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS product_trend_events (
    event_time      DateTime,
    product_id      String,
    product_name    String,
    category        LowCardinality(String),
    viral_score     Float32,
    video_count     UInt32,
    mention_count   UInt32,
    platform        LowCardinality(String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (category, product_id, event_time);

-- ─── AD PERFORMANCE EVENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_performance_events (
    event_time      DateTime,
    ad_id           String,
    campaign_id     String,
    user_id         String,
    network         LowCardinality(String),
    impressions     UInt64,
    clicks          UInt64,
    conversions     UInt32,
    spend           Decimal(10,2),
    revenue         Decimal(10,2),
    ctr             Float32,
    roas            Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (network, campaign_id, ad_id, event_time);

-- ─── HASHTAG TREND EVENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS hashtag_trend_events (
    event_time      DateTime,
    hashtag         String,
    platform        LowCardinality(String),
    post_count      UInt64,
    post_count_delta Int64,
    trend_velocity  Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (platform, hashtag, event_time)
TTL event_time + INTERVAL 3 MONTH;

-- ─── CRAWLER STATS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crawler_stats (
    event_time      DateTime,
    platform        LowCardinality(String),
    videos_crawled  UInt32,
    products_found  UInt32,
    errors          UInt32,
    duration_ms     UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (platform, event_time);

-- ─── MATERIALIZED VIEWS ─────────────────────────────────────

-- Top viral products (last 24h)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_viral_products_24h
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMMDD(toStartOfDay(event_time))
ORDER BY (category, product_id)
AS SELECT
    toStartOfHour(event_time) AS hour,
    product_id,
    product_name,
    category,
    maxState(viral_score)     AS max_viral_score,
    sumState(mention_count)   AS total_mentions,
    countState()              AS data_points
FROM product_trend_events
GROUP BY hour, product_id, product_name, category;

-- Platform performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_platform_crawl_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMMDD(event_time)
ORDER BY (platform, toStartOfHour(event_time))
AS SELECT
    toStartOfHour(event_time) AS hour,
    platform,
    sum(videos_crawled)  AS total_videos,
    sum(products_found)  AS total_products,
    sum(errors)          AS total_errors
FROM crawler_stats
GROUP BY hour, platform;
