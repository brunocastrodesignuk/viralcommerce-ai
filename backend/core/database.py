"""
ViralCommerce AI — Database connection managers
Suporta PostgreSQL (produção) e SQLite (desenvolvimento local).
Serviços opcionais (Redis, ClickHouse, Elasticsearch) degradam graciosamente.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.core.config import settings

log = structlog.get_logger()

# ─── SQLAlchemy Engine ────────────────────────────────────────
_IS_SQLITE = "sqlite" in settings.DATABASE_URL.lower()

if _IS_SQLITE:
    # SQLite: sem pool (StaticPool), sem pool_size
    from sqlalchemy.pool import StaticPool
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─── Redis (opcional) ─────────────────────────────────────────
_redis_pool = None


async def get_redis():
    global _redis_pool
    if _redis_pool is not None:
        return _redis_pool

    redis_url = settings.REDIS_URL or ""

    # fakeredis para desenvolvimento local
    if not redis_url or "fakeredis" in redis_url or "memory" in redis_url:
        try:
            import fakeredis.aioredis as fakeredis
            _redis_pool = fakeredis.FakeRedis(decode_responses=True)
            log.info("Using fakeredis (local mode)")
            return _redis_pool
        except ImportError:
            log.warning("fakeredis not installed — Redis disabled")
            return None

    try:
        import redis.asyncio as aioredis
        _redis_pool = await aioredis.from_url(
            redis_url, encoding="utf-8", decode_responses=True
        )
        await _redis_pool.ping()
        log.info("Redis connected", url=redis_url[:30])
    except Exception as e:
        log.warning("Redis unavailable", error=str(e))
        _redis_pool = None

    return _redis_pool


# ─── ClickHouse (opcional) ────────────────────────────────────
def get_clickhouse():
    if not settings.CLICKHOUSE_HOST:
        return None
    try:
        from clickhouse_driver import Client
        return Client(
            host=settings.CLICKHOUSE_HOST,
            port=settings.CLICKHOUSE_PORT,
            database=settings.CLICKHOUSE_DB,
            user=settings.CLICKHOUSE_USER,
            password=settings.CLICKHOUSE_PASSWORD,
        )
    except Exception as e:
        log.warning("ClickHouse unavailable", error=str(e))
        return None


# ─── Elasticsearch (opcional) ─────────────────────────────────
_es_client = None


def get_elasticsearch():
    global _es_client
    if not settings.ELASTICSEARCH_URL:
        return None
    if _es_client is not None:
        return _es_client
    try:
        from elasticsearch import AsyncElasticsearch
        _es_client = AsyncElasticsearch(
            hosts=[settings.ELASTICSEARCH_URL],
            retry_on_timeout=True,
            max_retries=3,
        )
    except Exception as e:
        log.warning("Elasticsearch unavailable", error=str(e))
    return _es_client


# ─── Startup / Shutdown ───────────────────────────────────────
async def init_db():
    log.info("Initializing database", url=settings.DATABASE_URL[:40])
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Redis — opcional
    try:
        redis = await get_redis()
        if redis:
            await redis.ping()
            log.info("Redis connected")
    except Exception as e:
        log.warning("Redis init failed", error=str(e))

    # Elasticsearch — opcional
    try:
        es = get_elasticsearch()
        if es:
            await es.ping()
            log.info("Elasticsearch connected")
    except Exception as e:
        log.warning("Elasticsearch init failed", error=str(e))

    log.info("Database ready")


async def close_db():
    await engine.dispose()
    global _redis_pool, _es_client
    if _redis_pool:
        try:
            await _redis_pool.aclose()
        except Exception:
            pass
    if _es_client:
        try:
            await _es_client.close()
        except Exception:
            pass
    log.info("Database connections closed")
