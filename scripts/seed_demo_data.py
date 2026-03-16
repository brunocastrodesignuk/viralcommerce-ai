"""
Seed script — populates the database with realistic demo data
Run: python scripts/seed_demo_data.py
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://viralcommerce:viralcommerce@localhost:5432/viralcommerce")
# Convert to asyncpg format if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

PRODUCT_NAMES = [
    "LED Galaxy Projector Night Light", "Portable Blender Smoothie Maker", "Posture Corrector Belt",
    "Jade Facial Roller & Gua Sha Set", "Resistance Bands Set 5-Pack", "Electric Scalp Massager",
    "Mushroom Coffee Blend Premium", "Magnetic Phone Car Mount", "Smart Water Bottle Tracker",
    "Mini Projector Portable 1080P", "Teeth Whitening Pen Kit", "Ice Roller Face Massager",
    "Sunset Lamp Gradient Light", "Hair Wax Stick Edge Control", "Portable Sauna Blanket",
    "Tongue Scraper Cleaner Set", "Green Powder Superfood Mix", "Acupressure Mat & Pillow Set",
    "Desktop Punching Bag Stress Relief", "Collagen Peptides Powder",
]
CATEGORIES = ["Beauty & Personal Care", "Home & Kitchen", "Electronics", "Sports & Outdoors", "Health & Wellness"]
PLATFORMS = ["tiktok", "instagram", "youtube", "pinterest"]
HASHTAGS = ["#TikTokMadeMeBuyIt", "#AmazonFinds", "#ViralProduct", "#MustHave", "#LifeHack", "#WorthIt", "#Trending", "#Satisfying"]

async def seed():
    async with AsyncSessionLocal() as db:
        from backend.models.product import Product
        from backend.models.video import Video
        from backend.models.hashtag import Hashtag

        # Clear existing
        print("Seeding products...")
        products = []
        for i, name in enumerate(PRODUCT_NAMES):
            p = Product(
                id=uuid.uuid4(),
                name=name,
                category=random.choice(CATEGORIES),
                description=f"Viral trending product: {name}. Thousands of orders daily.",
                tags=random.sample(["trending", "viral", "tiktok", "amazon", "bestseller", "organic"], 3),
                viral_score=round(random.uniform(65, 98), 1),
                competition_score=round(random.uniform(20, 60), 1),
                demand_score=round(random.uniform(70, 99), 1),
                estimated_price_min=round(random.uniform(8, 25), 2),
                estimated_price_max=round(random.uniform(28, 89), 2),
                image_urls=[f"https://via.placeholder.com/400x400?text={name.replace(' ', '+')}"],
                status="active",
                first_detected_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
            )
            products.append(p)
            db.add(p)

        print("Seeding hashtags...")
        for tag in HASHTAGS:
            h = Hashtag(
                id=uuid.uuid4(),
                tag=tag.lstrip("#"),
                platform="tiktok",
                post_count=random.randint(500_000, 50_000_000),
                trend_velocity=round(random.uniform(10, 95), 1),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(h)

        await db.commit()
        print(f"Seeded {len(products)} products and {len(HASHTAGS)} hashtags")

if __name__ == "__main__":
    asyncio.run(seed())
