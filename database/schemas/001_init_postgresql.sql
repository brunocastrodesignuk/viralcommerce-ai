-- ============================================================
-- ViralCommerce AI — PostgreSQL Core Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for embeddings

-- ─── ENUMS ───────────────────────────────────────────────────
CREATE TYPE platform_type AS ENUM (
    'tiktok', 'instagram', 'youtube', 'pinterest', 'amazon', 'temu', 'shein', 'aliexpress'
);
CREATE TYPE product_status AS ENUM ('pending', 'active', 'archived', 'flagged');
CREATE TYPE campaign_status AS ENUM ('draft', 'running', 'paused', 'completed', 'killed');
CREATE TYPE ad_network AS ENUM ('meta', 'google', 'tiktok_ads');
CREATE TYPE supplier_platform AS ENUM ('aliexpress', 'alibaba', '1688', 'cj_dropshipping', 'temu', 'spocket');

-- ─── VIDEOS ──────────────────────────────────────────────────
CREATE TABLE videos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform        platform_type NOT NULL,
    external_id     TEXT NOT NULL,
    url             TEXT NOT NULL,
    title           TEXT,
    caption         TEXT,
    hashtags        TEXT[],
    views           BIGINT DEFAULT 0,
    likes           BIGINT DEFAULT 0,
    shares          BIGINT DEFAULT 0,
    comments        BIGINT DEFAULT 0,
    author_handle   TEXT,
    author_followers BIGINT DEFAULT 0,
    thumbnail_url   TEXT,
    duration_sec    INTEGER,
    viral_score     DECIMAL(5,2) DEFAULT 0,
    crawled_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, external_id)
);
CREATE INDEX idx_videos_viral_score ON videos(viral_score DESC);
CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_hashtags ON videos USING GIN(hashtags);

-- ─── TREND SCORES (time-series snapshots) ───────────────────
CREATE TABLE trend_scores (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id    UUID REFERENCES videos(id) ON DELETE CASCADE,
    views       BIGINT,
    likes       BIGINT,
    shares      BIGINT,
    comments    BIGINT,
    viral_score DECIMAL(5,2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trend_scores_video_id ON trend_scores(video_id);
CREATE INDEX idx_trend_scores_recorded_at ON trend_scores(recorded_at DESC);

-- ─── HASHTAGS ────────────────────────────────────────────────
CREATE TABLE hashtags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag             TEXT UNIQUE NOT NULL,
    platform        platform_type,
    post_count      BIGINT DEFAULT 0,
    trend_velocity  DECIMAL(10,2) DEFAULT 0,
    is_tracked      BOOLEAN DEFAULT FALSE,
    first_seen_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_hashtags_tag ON hashtags USING GIN(tag gin_trgm_ops);
CREATE INDEX idx_hashtags_trend_velocity ON hashtags(trend_velocity DESC);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    slug                TEXT UNIQUE,
    category            TEXT,
    subcategory         TEXT,
    description         TEXT,
    tags                TEXT[],
    status              product_status DEFAULT 'pending',
    viral_score         DECIMAL(5,2) DEFAULT 0,
    competition_score   DECIMAL(5,2) DEFAULT 0,
    demand_score        DECIMAL(5,2) DEFAULT 0,
    estimated_price_min DECIMAL(10,2),
    estimated_price_max DECIMAL(10,2),
    image_urls          TEXT[],
    embedding           vector(512),        -- CLIP embedding
    source_video_ids    UUID[],
    first_detected_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_viral_score ON products(viral_score DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops);

-- ─── VIDEO <-> PRODUCT (many-to-many) ───────────────────────
CREATE TABLE video_products (
    video_id        UUID REFERENCES videos(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
    confidence      DECIMAL(4,3),
    bbox_x          DECIMAL(6,4),
    bbox_y          DECIMAL(6,4),
    bbox_w          DECIMAL(6,4),
    bbox_h          DECIMAL(6,4),
    frame_timestamp INTEGER,
    detected_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (video_id, product_id)
);

-- ─── SUPPLIERS ───────────────────────────────────────────────
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform        supplier_platform NOT NULL,
    external_id     TEXT,
    name            TEXT NOT NULL,
    url             TEXT,
    rating          DECIMAL(3,2),
    total_orders    INTEGER DEFAULT 0,
    response_time_h INTEGER,
    ships_from      TEXT,
    ships_to        TEXT[],
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, external_id)
);

-- ─── PRODUCT LISTINGS (supplier offers for a product) ────────
CREATE TABLE product_listings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID REFERENCES products(id) ON DELETE CASCADE,
    supplier_id         UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_url        TEXT,
    supplier_sku        TEXT,
    cost_price          DECIMAL(10,2) NOT NULL,
    shipping_cost       DECIMAL(10,2) DEFAULT 0,
    shipping_days_min   INTEGER,
    shipping_days_max   INTEGER,
    moq                 INTEGER DEFAULT 1,
    currency            CHAR(3) DEFAULT 'USD',
    in_stock            BOOLEAN DEFAULT TRUE,
    sale_price_suggested DECIMAL(10,2),
    profit_margin_pct   DECIMAL(5,2),
    roi_pct             DECIMAL(6,2),
    last_checked_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_product_listings_product ON product_listings(product_id);
CREATE INDEX idx_product_listings_margin ON product_listings(profit_margin_pct DESC);

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT,
    full_name       TEXT,
    plan            TEXT DEFAULT 'free',    -- free | pro | enterprise
    api_key         TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER SAVED PRODUCTS ─────────────────────────────────────
CREATE TABLE user_products (
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
    notes       TEXT,
    saved_at    TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- ─── MARKETING ASSETS ────────────────────────────────────────
CREATE TABLE marketing_assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    asset_type      TEXT NOT NULL, -- 'description' | 'headline' | 'hook' | 'tiktok_script' | 'caption' | 'landing_page'
    platform        TEXT,
    content         TEXT NOT NULL,
    tone            TEXT DEFAULT 'engaging',
    language        CHAR(5) DEFAULT 'en',
    generated_by    TEXT DEFAULT 'claude-sonnet-4-6',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_marketing_assets_product ON marketing_assets(product_id);

-- ─── CAMPAIGNS ───────────────────────────────────────────────
CREATE TABLE campaigns (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id),
    name                TEXT NOT NULL,
    network             ad_network NOT NULL,
    status              campaign_status DEFAULT 'draft',
    daily_budget        DECIMAL(10,2),
    total_spend         DECIMAL(10,2) DEFAULT 0,
    total_revenue       DECIMAL(10,2) DEFAULT 0,
    roas                DECIMAL(6,2),
    external_campaign_id TEXT,
    targeting           JSONB,
    started_at          TIMESTAMPTZ,
    ended_at            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ─── ADS ─────────────────────────────────────────────────────
CREATE TABLE ads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id     UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    network         ad_network NOT NULL,
    external_ad_id  TEXT,
    headline        TEXT,
    body            TEXT,
    creative_url    TEXT,
    status          TEXT DEFAULT 'active',
    impressions     BIGINT DEFAULT 0,
    clicks          BIGINT DEFAULT 0,
    conversions     INTEGER DEFAULT 0,
    spend           DECIMAL(10,2) DEFAULT 0,
    revenue         DECIMAL(10,2) DEFAULT 0,
    ctr             DECIMAL(6,4),
    cpc             DECIMAL(8,4),
    roas            DECIMAL(6,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_campaign ON ads(campaign_id);
CREATE INDEX idx_ads_roas ON ads(roas DESC NULLS LAST);

-- ─── CRAWLER JOBS ────────────────────────────────────────────
CREATE TABLE crawler_jobs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform    platform_type NOT NULL,
    job_type    TEXT NOT NULL,  -- 'hashtag_scan' | 'trending' | 'profile' | 'product_page'
    target      TEXT,
    status      TEXT DEFAULT 'queued',
    videos_found INTEGER DEFAULT 0,
    error_msg   TEXT,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
