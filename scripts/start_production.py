"""
Production startup script for Render.com
1. Normalises DATABASE_URL  (postgres:// → postgresql+asyncpg://)
2. Creates all DB tables (idempotent)
3. Seeds demo user if DB is empty
4. Starts uvicorn
"""
import asyncio
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def fix_db_url():
    """Render gives postgres:// — SQLAlchemy needs postgresql+asyncpg://"""
    url = os.environ.get("DATABASE_URL", "")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url:
        os.environ["DATABASE_URL"] = url
    return url


async def init_db():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from backend.core.database import Base

    # Register all models with Base
    import backend.models.user          # noqa
    import backend.models.hashtag       # noqa
    import backend.models.video         # noqa
    import backend.models.supplier      # noqa
    import backend.models.product       # noqa
    import backend.models.campaign      # noqa
    import backend.models.marketing_asset  # noqa
    import backend.models.crawler_job   # noqa

    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[startup] Database tables ready", flush=True)

    # Seed demo user if empty
    from sqlalchemy import select, func
    from backend.models.user import User
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        count = await db.scalar(select(func.count()).select_from(User))
        if count == 0:
            from passlib.context import CryptContext
            pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
            demo = User(
                email="demo@viralcommerce.ai",
                hashed_password=pwd.hash("Demo1234!"),
                full_name="Demo User",
                plan="pro",
                is_active=True,
            )
            db.add(demo)
            await db.commit()
            print("[startup] Demo user created: demo@viralcommerce.ai / Demo1234!", flush=True)

    await engine.dispose()


def main():
    print("[startup] ViralCommerce AI — Production Start", flush=True)

    db_url = fix_db_url()
    print(f"[startup] DB: {db_url[:40]}...", flush=True)

    asyncio.run(init_db())

    port = os.environ.get("PORT", "8000")
    print(f"[startup] Starting uvicorn on port {port}", flush=True)

    cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.main:create_app",
        "--factory",
        "--host", "0.0.0.0",
        "--port", port,
        "--workers", "1",
        "--log-level", "info",
    ]
    os.execv(sys.executable, cmd)


if __name__ == "__main__":
    main()
