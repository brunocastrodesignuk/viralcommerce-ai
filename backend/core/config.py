"""
ViralCommerce AI — Application Configuration
All settings loaded from environment variables with sensible defaults.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ────────────────────────────────────────────────────
    APP_NAME: str = "ViralCommerce AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://app.viralcommerce.ai"]

    # ── Database ───────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://viralcommerce:password@localhost:5432/viralcommerce"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # ── Redis ──────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600

    # ── Kafka ──────────────────────────────────────────────────
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_VIDEOS: str = "viral.videos.raw"
    KAFKA_TOPIC_PRODUCTS: str = "viral.products.detected"
    KAFKA_TOPIC_SCORES: str = "viral.scores.computed"
    KAFKA_TOPIC_SUPPLIERS: str = "viral.suppliers.found"

    # ── ClickHouse ─────────────────────────────────────────────
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 9000
    CLICKHOUSE_DB: str = "viralcommerce"
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""

    # ── Elasticsearch ──────────────────────────────────────────
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_INDEX_PRODUCTS: str = "vc_products"
    ELASTICSEARCH_INDEX_VIDEOS: str = "vc_videos"
    ELASTICSEARCH_INDEX_HASHTAGS: str = "vc_hashtags"

    # ── AI / LLM ───────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "claude-sonnet-4-6"
    YOLO_MODEL_PATH: str = "models/yolov8n.pt"
    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"

    # ── Viral Score ────────────────────────────────────────────
    VIRAL_SCORE_THRESHOLD: float = 70.0
    VIRAL_SCORE_WEIGHT_VIEWS: float = 0.4
    VIRAL_SCORE_WEIGHT_SHARES: float = 0.3
    VIRAL_SCORE_WEIGHT_COMMENTS: float = 0.2
    VIRAL_SCORE_WEIGHT_LIKES: float = 0.1

    # ── Ad Networks ────────────────────────────────────────────
    META_ACCESS_TOKEN: str = ""
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    GOOGLE_ADS_DEVELOPER_TOKEN: str = ""
    GOOGLE_ADS_CLIENT_ID: str = ""
    GOOGLE_ADS_CLIENT_SECRET: str = ""
    GOOGLE_ADS_REFRESH_TOKEN: str = ""
    TIKTOK_ADS_ACCESS_TOKEN: str = ""
    TIKTOK_ADS_APP_ID: str = ""

    # ── Crawler ────────────────────────────────────────────────
    CRAWLER_CONCURRENCY: int = 32
    CRAWLER_DELAY_SECONDS: float = 1.0
    CRAWLER_USER_AGENT: str = "Mozilla/5.0 (compatible; ViralBot/1.0)"
    PROXY_LIST: List[str] = []

    # ── Celery ─────────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── Monitoring ─────────────────────────────────────────────
    SENTRY_DSN: str = ""
    PROMETHEUS_PORT: int = 9090

    # ── Admin ──────────────────────────────────────────────────
    ADMIN_SECRET_KEY: str = "admin-change-me-in-production"

    # ── Email / SMTP ───────────────────────────────────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "noreply@viralcommerce.ai"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
