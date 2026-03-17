"""
ViralCommerce AI — FastAPI Application Entry Point
"""
import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import Counter, Histogram, make_asgi_app

from backend.core.config import settings
from backend.core.database import close_db, init_db
from backend.api.routes import (
    auth,
    videos,
    products,
    suppliers,
    marketing,
    campaigns,
    analytics,
    trends,
    crawler,
    radar,
    billing,
    shopify,
    notifications,
    admin,
)

log = structlog.get_logger()

# ─── Metrics ─────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request duration", ["endpoint"]
)


_NOTIFIED_VIRAL_IDS: set = set()

async def _viral_alert_loop():
    """Check every 15 min for products >= 95% viral score and email Pro/Enterprise subscribers."""
    import asyncio
    from backend.core.database import AsyncSessionLocal
    from backend.services.email import send_viral_alert_emails

    await asyncio.sleep(60)  # wait for startup to complete
    while True:
        try:
            async with AsyncSessionLocal() as db:
                sent, errors = await send_viral_alert_emails(db, min_score=95.0, notified_ids=_NOTIFIED_VIRAL_IDS)
                if sent:
                    log.info("Viral alert loop", sent=sent)
                if errors:
                    log.warning("Viral alert errors", errors=errors[:3])
        except Exception as e:
            log.warning("Viral alert loop error", error=str(e)[:200])
        await asyncio.sleep(15 * 60)  # every 15 minutes


async def _startup_data_refresh():
    """Auto-refresh images and hashtags on startup, then every 6 hours."""
    import asyncio
    from backend.core.database import AsyncSessionLocal
    from backend.models.product import Product
    from sqlalchemy import select

    await asyncio.sleep(8)  # wait for DB to be fully ready
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # 1. Refresh missing product images
                result = await db.scalars(select(Product).where(Product.status == "active"))
                products = result.all()
                # picsum.photos is far more reliable than loremflickr —
                # it's always up, CDN-backed, and returns consistent quality images.
                # We use a deterministic seed so the same product always gets
                # the same image across restarts.
                CATEGORY_SEEDS = {
                    "Beauty & Personal Care": [200, 201, 203, 339, 399, 445, 473, 487],
                    "Electronics":            [0, 3, 20, 48, 119, 160, 180, 215],
                    "Home & Kitchen":         [101, 214, 237, 284, 349, 350, 356, 380],
                    "Clothing & Accessories": [64, 75, 174, 192, 219, 258, 292, 326],
                    "Sports & Outdoors":      [416, 428, 433, 461, 531, 547, 571, 593],
                    "Health & Wellness":      [236, 247, 279, 303, 315, 331, 337, 407],
                    "Toys & Games":           [191, 249, 268, 305, 360, 371, 395, 412],
                }
                DEFAULT_SEEDS = [1, 10, 15, 28, 42, 55, 67, 84]
                updated = 0
                for p in products:
                    has_good_image = (
                        p.image_urls and p.image_urls != [] and p.image_urls != [""]
                        and not any("via.placeholder.com" in u for u in p.image_urls)
                        and not any("placehold.co" in u for u in p.image_urls)
                        and not any("loremflickr.com" in u for u in p.image_urls)
                    )
                    if has_good_image:
                        continue
                    seeds = CATEGORY_SEEDS.get(p.category or "", DEFAULT_SEEDS)
                    name_hash = abs(hash(p.name or "product"))
                    img_seed = seeds[name_hash % len(seeds)]
                    p.image_urls = [f"https://picsum.photos/seed/{img_seed}/400/400"]
                    updated += 1
                if updated:
                    await db.commit()
                    log.info("Startup image refresh", updated=updated, total=len(products))

                # 2. Refresh hashtags
                from backend.services.crawler.tiktok_shop import get_tiktok_hashtags
                from backend.models.hashtag import Hashtag
                from datetime import datetime, timezone
                import uuid as _uuid
                hashtags = await get_tiktok_hashtags(limit=15)
                for h in hashtags:
                    tag = h.get("tag", "")
                    if not tag:
                        continue
                    existing = await db.scalar(select(Hashtag).where(Hashtag.tag == tag))
                    if existing:
                        existing.post_count = h.get("post_count", existing.post_count)
                        existing.trend_velocity = h.get("trend_velocity", existing.trend_velocity)
                        existing.updated_at = datetime.now(timezone.utc)
                    else:
                        db.add(Hashtag(
                            id=_uuid.uuid4(), tag=tag, platform="tiktok",
                            post_count=h.get("post_count", 0),
                            trend_velocity=h.get("trend_velocity", 70.0),
                            updated_at=datetime.now(timezone.utc),
                        ))
                await db.commit()
                log.info("Startup hashtag refresh", count=len(hashtags))
        except Exception as e:
            log.warning("Startup data refresh error", error=str(e)[:200])

        await asyncio.sleep(6 * 3600)  # repeat every 6 hours


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    log.info("Starting ViralCommerce AI", version=settings.APP_VERSION)
    await init_db()
    # Launch background data refresh (non-blocking)
    asyncio.create_task(_startup_data_refresh())
    asyncio.create_task(_viral_alert_loop())
    yield
    log.info("Shutting down ViralCommerce AI")
    await close_db()


# ─── App Factory ─────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered viral product discovery and campaign automation platform",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ─────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        REQUEST_COUNT.labels(request.method, request.url.path, response.status_code).inc()
        REQUEST_LATENCY.labels(request.url.path).observe(duration)
        return response

    # ── Prometheus metrics endpoint ────────────────────────────
    metrics_app = make_asgi_app()
    app.mount("/metrics", metrics_app)

    # ── API Routes ─────────────────────────────────────────────
    prefix = "/api/v1"
    app.include_router(auth.router,       prefix=f"{prefix}/auth",       tags=["Auth"])
    app.include_router(videos.router,     prefix=f"{prefix}/videos",     tags=["Videos"])
    app.include_router(products.router,   prefix=f"{prefix}/products",   tags=["Products"])
    app.include_router(suppliers.router,  prefix=f"{prefix}/suppliers",  tags=["Suppliers"])
    app.include_router(marketing.router,  prefix=f"{prefix}/marketing",  tags=["Marketing"])
    app.include_router(campaigns.router,  prefix=f"{prefix}/campaigns",  tags=["Campaigns"])
    app.include_router(analytics.router,  prefix=f"{prefix}/analytics",  tags=["Analytics"])
    app.include_router(trends.router,     prefix=f"{prefix}/trends",     tags=["Trends"])
    app.include_router(crawler.router,    prefix=f"{prefix}/crawler",    tags=["Crawler"])
    app.include_router(radar.router,      prefix=f"{prefix}",            tags=["Trend Radar"])
    app.include_router(billing.router,    prefix=f"{prefix}/billing",    tags=["Billing"])
    app.include_router(shopify.router,        prefix=f"{prefix}/shopify",        tags=["Shopify"])
    app.include_router(notifications.router, prefix=f"{prefix}/notifications", tags=["Notifications"])
    app.include_router(admin.router,        prefix=f"{prefix}/admin",        tags=["Admin"])

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()
