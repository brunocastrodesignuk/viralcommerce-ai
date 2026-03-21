"""
ViralCommerce AI — Database Seed Script
Populates the database with realistic demo data for development and testing.

Usage:
    python -m database.seed
    python database/seed.py --reset   (drops and recreates all data)
"""
import asyncio
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

# ─── Setup path ──────────────────────────────────────────────────────────────
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.core.config import settings
from backend.models.user import User
from backend.models.video import Video, TrendScore
from backend.models.product import Product, ProductListing
from backend.models.supplier import Supplier
from backend.models.hashtag import Hashtag
from backend.models.campaign import Campaign, Ad
from backend.models.crawler_job import CrawlerJob
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
rng = random.Random(42)  # Deterministic seed for reproducibility

# ─── Demo Data ───────────────────────────────────────────────────────────────

DEMO_PRODUCTS = [
    {
        "name": "LED Strip Lights RGB Smart",
        "category": "Home & Garden",
        "subcategory": "Lighting",
        "tags": ["led", "smart home", "rgb", "aesthetic"],
        "viral_score": 94.2,
        "competition_score": 65.0,
        "demand_score": 88.5,
        # Custo real no fornecedor (AliExpress/CJ) em USD
        "estimated_price_min": 3.99,
        "estimated_price_max": 12.99,
        "image_urls": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"],
    },
    {
        "name": "Mini Portable Espresso Maker",
        "category": "Kitchen",
        "subcategory": "Coffee Makers",
        "tags": ["coffee", "portable", "espresso", "travel"],
        "viral_score": 88.7,
        "competition_score": 55.0,
        "demand_score": 82.3,
        "estimated_price_min": 18.99,
        "estimated_price_max": 38.99,
        "image_urls": ["https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop"],
    },
    {
        "name": "Galaxy Star Projector Night Light",
        "category": "Home & Garden",
        "subcategory": "Décor",
        "tags": ["projector", "stars", "bedroom", "aesthetic"],
        "viral_score": 91.5,
        "competition_score": 48.0,
        "demand_score": 91.0,
        "estimated_price_min": 9.99,
        "estimated_price_max": 22.99,
        "image_urls": ["https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop"],
    },
    {
        "name": "Wireless Charging Pad 3-in-1",
        "category": "Electronics",
        "subcategory": "Chargers",
        "tags": ["wireless", "charging", "apple", "samsung"],
        "viral_score": 79.3,
        "competition_score": 72.0,
        "demand_score": 78.0,
        "estimated_price_min": 11.99,
        "estimated_price_max": 28.99,
        "image_urls": ["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop"],
    },
    {
        "name": "Posture Corrector Back Brace",
        "category": "Health & Beauty",
        "subcategory": "Posture",
        "tags": ["posture", "health", "back pain", "office"],
        "viral_score": 85.1,
        "competition_score": 60.0,
        "demand_score": 84.5,
        "estimated_price_min": 4.99,
        "estimated_price_max": 16.99,
        "image_urls": ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop"],
    },
    {
        "name": "Silicone Makeup Brush Set 10pc",
        "category": "Beauty",
        "subcategory": "Makeup Tools",
        "tags": ["makeup", "beauty", "brushes", "silicone"],
        "viral_score": 87.6,
        "competition_score": 52.0,
        "demand_score": 86.0,
        "estimated_price_min": 2.99,
        "estimated_price_max": 9.99,
        "image_urls": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop"],
    },
    {
        "name": "Electric Milk Frother Handheld",
        "category": "Kitchen",
        "subcategory": "Beverages",
        "tags": ["coffee", "milk frother", "latte", "cappuccino"],
        "viral_score": 73.4,
        "competition_score": 58.0,
        "demand_score": 75.5,
        "estimated_price_min": 1.99,
        "estimated_price_max": 6.99,
        "image_urls": ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop"],
    },
    {
        "name": "Foldable Yoga Mat with Alignment Lines",
        "category": "Sports & Outdoors",
        "subcategory": "Yoga",
        "tags": ["yoga", "fitness", "workout", "foldable"],
        "viral_score": 76.8,
        "competition_score": 64.0,
        "demand_score": 79.3,
        "estimated_price_min": 14.99,
        "estimated_price_max": 32.99,
        "image_urls": ["https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop"],
    },
]

DEMO_SUPPLIERS = [
    {
        "platform": "aliexpress",
        "name": "Shenzhen TechGoods Store",
        "rating": 4.8,
        "ships_to": ["US", "UK", "CA", "AU", "DE"],
        "is_verified": True,
    },
    {
        "platform": "aliexpress",
        "name": "BeautyPro Wholesale",
        "rating": 4.6,
        "ships_to": ["US", "UK", "FR", "AU"],
        "is_verified": True,
    },
    {
        "platform": "cj_dropshipping",
        "name": "CJ Smart Home Hub",
        "rating": 4.9,
        "ships_to": ["US", "UK", "CA", "DE", "FR"],
        "is_verified": True,
    },
    {
        "platform": "alibaba",
        "name": "GuangZhou ElectroSource",
        "rating": 4.7,
        "ships_to": ["US", "UK", "CA"],
        "is_verified": False,
    },
    {
        "platform": "temu",
        "name": "Temu Official Store",
        "rating": 4.4,
        "ships_to": ["US", "UK"],
        "is_verified": True,
    },
]

DEMO_HASHTAGS = [
    ("tiktokmademebuyit", "tiktok", 8_500_000_000, 450.0),
    ("amazonfinds", "tiktok", 3_200_000_000, 320.5),
    ("aliexpressfinds", "tiktok", 1_800_000_000, 280.3),
    ("viralproducts", "tiktok", 950_000_000, 195.8),
    ("musthaveproducts", "tiktok", 720_000_000, 165.2),
    ("smarthomedecor", "tiktok", 430_000_000, 520.1),  # Emerging
    ("ledlights", "tiktok", 2_100_000_000, 340.7),
    ("espressohacks", "tiktok", 180_000_000, 890.3),    # Fast rising
    ("aestheticroom", "instagram", 5_400_000_000, 210.5),
    ("homeorganization", "instagram", 2_800_000_000, 185.3),
    ("skincareroutine", "instagram", 9_200_000_000, 155.8),
    ("gadgetsunder50", "youtube", 145_000_000, 1250.4),  # Very fast
    ("productreview", "youtube", 890_000_000, 95.3),
]

DEMO_VIDEOS = [
    {
        "platform": "tiktok",
        "title": "This LED strip CHANGED my room 😍",
        "hashtags": ["ledlights", "roomdecor", "aestheticroom", "tiktokmademebuyit"],
        "view_count": 12_400_000,
        "like_count": 987_000,
        "share_count": 145_000,
        "comment_count": 23_400,
        "viral_score": 94.2,
        "author_handle": "@roomaesthetic22",
        "author_followers": 2_100_000,
    },
    {
        "platform": "tiktok",
        "title": "Portable espresso = best travel hack",
        "hashtags": ["espresso", "travelhacks", "coffeelover", "amazonfinds"],
        "view_count": 8_700_000,
        "like_count": 654_000,
        "share_count": 98_000,
        "comment_count": 18_700,
        "viral_score": 88.7,
        "author_handle": "@travelwithstyle",
        "author_followers": 890_000,
    },
    {
        "platform": "instagram",
        "title": "Galaxy projector = instant spa vibes ✨",
        "hashtags": ["galaxyprojector", "aestheticroom", "bedroomdecor", "amazonfinds"],
        "view_count": 5_300_000,
        "like_count": 423_000,
        "share_count": 67_000,
        "comment_count": 9_800,
        "viral_score": 91.5,
        "author_handle": "@minimalhomedecor",
        "author_followers": 1_450_000,
    },
    {
        "platform": "youtube",
        "title": "Testing VIRAL TikTok Products So You Don't Have To",
        "hashtags": ["viralproducts", "tiktokmademebuyit", "productreview"],
        "view_count": 3_200_000,
        "like_count": 287_000,
        "share_count": 45_000,
        "comment_count": 12_300,
        "viral_score": 79.3,
        "author_handle": "@TechTestLab",
        "author_followers": 4_200_000,
    },
    {
        "platform": "tiktok",
        "title": "This posture brace fixed my back pain in 1 week",
        "hashtags": ["posturecorrector", "backpain", "healthhacks", "worthit"],
        "view_count": 6_800_000,
        "like_count": 512_000,
        "share_count": 87_000,
        "comment_count": 15_200,
        "viral_score": 85.1,
        "author_handle": "@healthwithme",
        "author_followers": 670_000,
    },
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def slug(name: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def rand_date(days_ago_max: int = 30) -> datetime:
    delta = timedelta(
        days=rng.randint(0, days_ago_max),
        hours=rng.randint(0, 23),
        minutes=rng.randint(0, 59),
    )
    return datetime.now(timezone.utc) - delta


# ─── Seeder ───────────────────────────────────────────────────────────────────

async def seed(reset: bool = False):
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        if reset:
            print("🗑️  Clearing existing demo data…")
            for model in [Ad, Campaign, ProductListing, CrawlerJob, TrendScore, Video, Product, Supplier, Hashtag]:
                from sqlalchemy import delete
                await db.execute(delete(model))
            # Keep users
            await db.commit()

        print("👤 Creating demo user…")
        from sqlalchemy import select
        existing_user = (
            await db.execute(select(User).where(User.email == "demo@viralcommerce.ai"))
        ).scalar_one_or_none()

        if not existing_user:
            demo_user = User(
                email="demo@viralcommerce.ai",
                hashed_password=pwd_ctx.hash("Demo1234!"),
                full_name="Demo User",
                plan="pro",
                is_active=True,
            )
            db.add(demo_user)
            await db.flush()
            user_id = demo_user.id
        else:
            user_id = existing_user.id
        print(f"   ✅ User: demo@viralcommerce.ai / Demo1234!")

        # ── Hashtags ──────────────────────────────────────────────────────
        print("🏷️  Seeding hashtags…")
        hashtag_ids = {}
        for tag, platform, post_count, velocity in DEMO_HASHTAGS:
            existing = (await db.execute(select(Hashtag).where(Hashtag.tag == tag))).scalar_one_or_none()
            if not existing:
                ht = Hashtag(
                    tag=tag, platform=platform,
                    post_count=post_count,
                    trend_velocity=velocity,
                    is_tracked=True,
                )
                db.add(ht)
                await db.flush()
                hashtag_ids[tag] = ht.id
        await db.commit()
        print(f"   ✅ {len(DEMO_HASHTAGS)} hashtags")

        # ── Suppliers ─────────────────────────────────────────────────────
        print("🏭 Seeding suppliers…")
        supplier_ids = []
        for sup in DEMO_SUPPLIERS:
            s = Supplier(
                platform=sup["platform"],
                external_id=f"demo_{uuid.uuid4().hex[:8]}",
                name=sup["name"],
                rating=sup["rating"],
                ships_to=sup["ships_to"],
                is_verified=sup["is_verified"],
            )
            db.add(s)
            await db.flush()
            supplier_ids.append(s.id)
        await db.commit()
        print(f"   ✅ {len(supplier_ids)} suppliers")

        # ── Videos ────────────────────────────────────────────────────────
        print("🎥 Seeding videos…")
        video_ids = []
        for v in DEMO_VIDEOS:
            vid = Video(
                platform=v["platform"],
                external_id=f"demo_{uuid.uuid4().hex[:12]}",
                url=f"https://{v['platform']}.com/video/{uuid.uuid4().hex[:10]}",
                title=v["title"],
                caption=v["title"],
                hashtags=v["hashtags"],
                views=v["view_count"],
                likes=v["like_count"],
                shares=v["share_count"],
                comments=v["comment_count"],
                viral_score=v["viral_score"],
                author_handle=v["author_handle"],
                author_followers=v["author_followers"],
                thumbnail_url=f"https://picsum.photos/seed/{uuid.uuid4().hex[:6]}/640/360",
                published_at=rand_date(14),
            )
            db.add(vid)
            await db.flush()
            video_ids.append(vid.id)

            # Add historical trend scores (simulated 7-day history)
            for i in range(7):
                decay = rng.uniform(0.6, 0.9) ** (7 - i)
                ts = TrendScore(
                    video_id=vid.id,
                    viral_score=v["viral_score"] * decay,
                    views=int(v["view_count"] * decay),
                    likes=int(v["like_count"] * decay),
                    shares=int(v["share_count"] * decay),
                    comments=int(v["comment_count"] * decay),
                    recorded_at=datetime.now(timezone.utc) - timedelta(days=7 - i),
                )
                db.add(ts)

        await db.commit()
        print(f"   ✅ {len(video_ids)} videos with trend history")

        # ── Products ──────────────────────────────────────────────────────
        print("📦 Seeding products…")
        product_ids = []
        for i, p in enumerate(DEMO_PRODUCTS):
            product = Product(
                name=p["name"],
                slug=slug(p["name"]),
                category=p["category"],
                subcategory=p.get("subcategory"),
                tags=p["tags"],
                viral_score=p["viral_score"],
                competition_score=p["competition_score"],
                demand_score=p["demand_score"],
                estimated_price_min=p["estimated_price_min"],
                estimated_price_max=p["estimated_price_max"],
                image_urls=p["image_urls"],
                source_video_ids=[str(video_ids[i % len(video_ids)])],
                status="active",
                first_detected_at=rand_date(20),
            )
            db.add(product)
            await db.flush()
            product_ids.append(product.id)

            # Add 2-3 supplier listings per product
            for sup_id in rng.sample(supplier_ids, k=min(3, len(supplier_ids))):
                cost = rng.uniform(p["estimated_price_min"] * 0.15, p["estimated_price_min"] * 0.35)
                shipping = rng.uniform(1.5, 5.0)
                sale = p["estimated_price_max"] * rng.uniform(0.7, 0.9)
                margin = ((sale - cost - shipping) / sale) * 100

                listing = ProductListing(
                    product_id=product.id,
                    supplier_id=sup_id,
                    supplier_url=f"https://aliexpress.com/item/{rng.randint(1000000, 9999999)}.html",
                    cost_price=round(cost, 2),
                    shipping_cost=round(shipping, 2),
                    moq=rng.choice([1, 1, 1, 5, 10]),
                    shipping_days_min=rng.randint(7, 14),
                    shipping_days_max=rng.randint(15, 25),
                    profit_margin_pct=round(margin, 1),
                    roi_pct=round((margin / (100 - margin)) * 100, 1) if margin < 100 else 0,
                    in_stock=True,
                )
                db.add(listing)

        await db.commit()
        print(f"   ✅ {len(product_ids)} products with supplier listings")

        # ── Campaigns ─────────────────────────────────────────────────────
        print("📣 Seeding campaigns…")
        networks = ["meta", "tiktok_ads", "google"]
        statuses = ["active", "active", "active", "paused", "completed"]
        campaign_ids = []

        for i, prod_id in enumerate(product_ids[:5]):
            network = networks[i % len(networks)]
            status = statuses[i % len(statuses)]
            spend = rng.uniform(50, 800)
            roas_val = rng.uniform(0.5, 4.5)
            revenue = spend * roas_val

            campaign = Campaign(
                product_id=prod_id,
                user_id=user_id,
                name=f"{DEMO_PRODUCTS[i]['name'][:40]} — {network.upper()}",
                network=network,
                status=status,
                daily_budget=rng.choice([50, 100, 150, 200]),
                total_spend=round(spend, 2),
                total_revenue=round(revenue, 2),
                roas=round(roas_val, 2),
                targeting={"age_min": 18, "age_max": 45, "interests": DEMO_PRODUCTS[i]["tags"]},
                started_at=rand_date(15),
            )
            db.add(campaign)
            await db.flush()
            campaign_ids.append(campaign.id)

            # 10 ads per campaign
            for j in range(10):
                ad_spend = spend / 10 * rng.uniform(0.5, 1.8)
                ad_roas = rng.uniform(0.3, 5.0)
                ad_revenue = ad_spend * ad_roas
                impressions = int(rng.uniform(10_000, 500_000))
                clicks = int(impressions * rng.uniform(0.01, 0.06))
                conversions = int(clicks * rng.uniform(0.02, 0.08))

                ad = Ad(
                    campaign_id=campaign.id,
                    network=network,
                    external_ad_id=f"ad_{uuid.uuid4().hex[:10]}",
                    headline=rng.choice([
                        f"🔥 {DEMO_PRODUCTS[i]['name']} — Limited Stock",
                        f"Viral {DEMO_PRODUCTS[i]['category']} Find You Can't Miss",
                        f"Why Everyone Is Buying This {DEMO_PRODUCTS[i]['name']}",
                        f"⚡ Flash Sale: {DEMO_PRODUCTS[i]['name']} — 50% Off",
                        f"The {DEMO_PRODUCTS[i]['name']} TikTok Can't Stop Talking About",
                        f"Get {DEMO_PRODUCTS[i]['name']} Before It Sells Out",
                        f"Upgrade Your {DEMO_PRODUCTS[i]['category']} Game Today",
                        f"As Seen On TikTok: {DEMO_PRODUCTS[i]['name']}",
                        f"Top Rated {DEMO_PRODUCTS[i]['name']} — Ships Free",
                        f"Transform Your Life With This {DEMO_PRODUCTS[i]['name']}",
                    ]),
                    status="active" if ad_roas > 0.8 else "paused",
                    impressions=impressions,
                    clicks=clicks,
                    conversions=conversions,
                    spend=round(ad_spend, 2),
                    revenue=round(ad_revenue, 2),
                    ctr=round(clicks / impressions, 4) if impressions else 0,
                    cpc=round(ad_spend / clicks, 2) if clicks else 0,
                    roas=round(ad_roas, 2),
                )
                db.add(ad)

        await db.commit()
        print(f"   ✅ {len(campaign_ids)} campaigns with 10 ads each")

        # ── Crawler Jobs ──────────────────────────────────────────────────
        print("🕷️  Seeding crawler jobs…")
        platforms = ["tiktok", "instagram", "youtube", "amazon", "pinterest"]
        job_types = ["trending", "hashtag_scan", "trending", "trending"]
        statuses_job = ["completed", "completed", "completed", "failed", "running"]

        for _ in range(20):
            platform = rng.choice(platforms)
            jtype = rng.choice(job_types)
            status = rng.choice(statuses_job)
            started = rand_date(7)
            finished = started + timedelta(minutes=rng.randint(2, 12)) if status != "running" else None

            job = CrawlerJob(
                platform=platform,
                job_type=jtype,
                target=rng.choice(["tiktokmademebuyit", "amazonfinds", None, None, None]),
                status=status,
                videos_found=rng.randint(50, 500) if status == "completed" else None,
                error_msg="spider returned non-zero exit code" if status == "failed" else None,
                started_at=started,
                finished_at=finished,
                created_at=started - timedelta(seconds=rng.randint(1, 30)),
            )
            db.add(job)

        await db.commit()
        print("   ✅ 20 crawler jobs")

    await engine.dispose()
    print("\n✨ Seed complete! Visit http://localhost:3000 and log in with:")
    print("   Email:    demo@viralcommerce.ai")
    print("   Password: Demo1234!")


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    reset = "--reset" in sys.argv
    asyncio.run(seed(reset=reset))
