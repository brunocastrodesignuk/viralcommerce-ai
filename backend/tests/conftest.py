"""
Test fixtures and configuration for ViralCommerce AI backend tests.

Uses an in-memory SQLite database (via aiosqlite) to avoid needing
a real PostgreSQL instance in CI. PostgreSQL-specific types (UUID,
ARRAY, JSONB) are mapped to compatible SQLite equivalents.
"""
import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from backend.core.database import Base, get_db
from backend.models import *  # noqa — ensure all models are registered

# ─── Test database (SQLite in-memory) ────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Fresh session per test, rolls back after each test."""
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()


# ─── FastAPI test client ──────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTPX async client wired to the test DB."""
    from backend.main import create_app

    app = create_app()

    # Override the DB dependency
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ─── Auth helpers ─────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def registered_user(client: AsyncClient) -> dict:
    """Register a test user and return its data."""
    payload = {
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "password": "TestPass123!",
        "full_name": "Test User",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return {**payload, "id": resp.json()["id"]}


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client: AsyncClient, registered_user: dict) -> dict:
    """Return Authorization headers for a logged-in test user."""
    form = {
        "username": registered_user["email"],
        "password": registered_user["password"],
    }
    resp = await client.post(
        "/api/v1/auth/token",
        data=form,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── Seed helpers ─────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def seed_product(db_session: AsyncSession):
    """Create and return a single Product row."""
    from backend.models.product import Product
    product = Product(
        name="Test LED Strip",
        slug=f"test-led-strip-{uuid.uuid4().hex[:6]}",
        category="Electronics",
        viral_score=85.0,
        competition_score=50.0,
        demand_score=75.0,
        estimated_price_min=12.99,
        estimated_price_max=39.99,
        is_active=True,
        status="active",
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product


@pytest_asyncio.fixture(scope="function")
async def seed_campaign(db_session: AsyncSession, seed_product, registered_user):
    """Create and return a Campaign row."""
    from backend.models.campaign import Campaign
    import uuid as _uuid
    campaign = Campaign(
        product_id=seed_product.id,
        user_id=_uuid.UUID(registered_user["id"]),
        name="Test Campaign",
        network="meta",
        status="draft",
        daily_budget=50.0,
        total_spend=0.0,
        total_revenue=0.0,
        roas=0.0,
    )
    db_session.add(campaign)
    await db_session.commit()
    await db_session.refresh(campaign)
    return campaign
