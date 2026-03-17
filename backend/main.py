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
)

log = structlog.get_logger()

# ─── Metrics ─────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request duration", ["endpoint"]
)


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
                CATEGORY_COLORS = {
                    "Beauty & Personal Care": ("1e1b4b", "a78bfa", "beauty"),
                    "Electronics": ("0f172a", "38bdf8", "tech"),
                    "Home & Kitchen": ("14532d", "86efac", "home"),
                    "Clothing & Accessories": ("4c0519", "fda4af", "fashion"),
                    "Sports & Outdoors": ("1c1917", "fdba74", "sports"),
                    "Health & Wellness": ("052e16", "6ee7b7", "health"),
                    "Toys & Games": ("1e1b4b", "fbbf24", "toys"),
                }
                updated = 0
                for p in products:
                    has_good_image = (
                        p.image_urls and p.image_urls != [] and p.image_urls != [""]
                        and not any("via.placeholder.com" in u for u in p.image_urls)
                    )
                    if has_good_image:
                        continue
                    bg, fg, hint = CATEGORY_COLORS.get(p.category, ("0f172a", "38bdf8", "product"))
                    words = (p.name or hint).split()[:2]
                    text = "+".join(w[:6] for w in words) if words else hint
                    p.image_urls = [f"https://placehold.co/400x400/{bg}/{fg}?text={text}"]
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

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()
