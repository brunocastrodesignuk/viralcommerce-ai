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
)

log = structlog.get_logger()

# ─── Metrics ─────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", "HTTP request duration", ["endpoint"]
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting ViralCommerce AI", version=settings.APP_VERSION)
    await init_db()
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

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()
