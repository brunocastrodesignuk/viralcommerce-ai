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
        # Safe migrations — add columns that may not exist yet
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(64)",
        ]
        for sql in migrations:
            try:
                await conn.execute(__import__("sqlalchemy").text(sql))
            except Exception:
                pass  # Column already exists or table not created yet
    print("[startup] Database tables ready", flush=True)

    # Seed demo data
    import random as _rand, uuid as _uuid
    from datetime import timedelta
    from sqlalchemy import select, func
    from backend.models.user import User
    from backend.models.product import Product
    from backend.models.hashtag import Hashtag
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        # Demo user
        user_count = await db.scalar(select(func.count()).select_from(User))
        if user_count == 0:
            from passlib.context import CryptContext
            pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
            demo = User(
                email="demo@viralcommerce.ai",
                hashed_password=pwd.hash("Demo1234!"),
                full_name="Demo User", plan="pro", is_active=True,
            )
            db.add(demo)
            await db.commit()
            print("[startup] Demo user created: demo@viralcommerce.ai / Demo1234!", flush=True)

        # Demo products
        prod_count = await db.scalar(select(func.count()).select_from(Product))
        if prod_count == 0:
            DEMO = [
                ("LED Galaxy Projector Night Light","Home & Kitchen",88.5,45.2,72.1,12.99,49.99),
                ("Portable Blender Smoothie Maker","Home & Kitchen",92.1,38.7,85.3,18.50,59.99),
                ("Jade Facial Roller & Gua Sha Set","Beauty & Personal Care",95.3,25.1,91.2,4.20,29.99),
                ("Resistance Bands Set 5-Pack","Sports & Outdoors",87.8,55.3,88.4,6.50,34.99),
                ("Electric Scalp Massager","Beauty & Personal Care",91.2,42.0,89.7,8.90,39.99),
                ("Sunset Lamp Gradient Light","Home & Kitchen",93.7,30.5,90.1,7.80,44.99),
                ("Posture Corrector Belt","Sports & Outdoors",89.4,48.2,83.5,5.30,27.99),
                ("Mushroom Coffee Blend Premium","Health & Wellness",86.9,35.8,79.3,12.00,49.99),
                ("Magnetic Phone Car Mount","Electronics",84.2,62.1,76.8,3.50,19.99),
                ("Ice Roller Face Massager","Beauty & Personal Care",90.5,28.4,87.6,5.10,24.99),
                ("Teeth Whitening Pen Kit","Beauty & Personal Care",88.1,51.3,82.9,3.80,22.99),
                ("Acupressure Mat & Pillow Set","Health & Wellness",85.7,40.6,80.2,14.20,54.99),
                ("Mini Projector Portable 1080P","Electronics",82.3,58.9,74.1,35.00,129.99),
                ("Green Powder Superfood Mix","Health & Wellness",87.4,33.7,81.5,15.00,59.99),
                ("Collagen Peptides Powder","Health & Wellness",89.8,44.2,85.0,11.50,44.99),
                ("Hair Wax Stick Edge Control","Beauty & Personal Care",91.6,36.8,88.3,2.50,14.99),
                ("Smart Water Bottle Tracker","Sports & Outdoors",83.5,47.1,77.4,8.00,35.99),
                ("Portable Sauna Blanket","Health & Wellness",86.2,29.3,79.8,28.00,119.99),
                ("Tongue Scraper Cleaner Set","Beauty & Personal Care",84.9,22.5,78.6,1.50,9.99),
                ("Desktop Punching Bag Stress Relief","Sports & Outdoors",88.7,41.9,84.2,9.50,39.99),
            ]
            for name, cat, vs, cs, ds, pmin, pmax in DEMO:
                slug = name.lower().replace(" ","‑").replace("&","and")[:80] + f"-{str(_uuid.uuid4())[:6]}"
                p = Product(
                    id=_uuid.uuid4(), name=name, slug=slug, category=cat,
                    description=f"Viral trending product: {name}.",
                    tags=["viral","trending","tiktok"], status="active",
                    viral_score=vs, competition_score=cs, demand_score=ds,
                    estimated_price_min=pmin, estimated_price_max=pmax,
                    image_urls=[f"https://via.placeholder.com/400x400/111827/0ea5e9?text={name[:12].replace(' ','+')}"],
                    first_detected_at=datetime.now(timezone.utc) - timedelta(days=_rand.randint(1,14)),
                )
                db.add(p)
            HASHTAGS = [
                ("TikTokMadeMeBuyIt",28_500_000,92.3),("AmazonFinds",15_200_000,87.1),
                ("ViralProduct",9_800_000,85.4),("MustHave",7_300_000,78.9),
                ("LifeHack",12_100_000,82.7),("WorthIt",5_400_000,71.2),
                ("Trending",45_000_000,95.8),("Satisfying",22_000_000,88.6),
                ("GreenFlags",3_200_000,68.4),("CleanTok",8_700_000,76.3),
            ]
            for tag, posts, vel in HASHTAGS:
                h = Hashtag(id=_uuid.uuid4(), tag=tag, platform="tiktok",
                            post_count=posts, trend_velocity=vel,
                            updated_at=datetime.now(timezone.utc))
                db.add(h)
            await db.commit()
            print(f"[startup] Seeded {len(DEMO)} demo products + {len(HASHTAGS)} hashtags", flush=True)

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
