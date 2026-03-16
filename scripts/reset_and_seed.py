"""
One-shot: drop all tables, recreate, seed with demo data.
Run from project root: python scripts/reset_and_seed.py
"""
import os
import sys
import asyncio
import random
import re
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Remove stale DB files ──────────────────────────────────────────────────────
for fname in ["viralcommerce.db", "viralcommerce.db-shm", "viralcommerce.db-wal", "test_verify.db"]:
    if os.path.exists(fname):
        os.remove(fname)
        print(f"Removed {fname}")

# ── Imports (after path setup) ─────────────────────────────────────────────────
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from backend.core.database import engine, Base
import backend.models.user          # noqa – registers with Base
import backend.models.hashtag       # noqa
import backend.models.video         # noqa
import backend.models.supplier      # noqa
import backend.models.product       # noqa
import backend.models.campaign      # noqa
import backend.models.marketing_asset  # noqa
import backend.models.crawler_job   # noqa

from backend.models.user import User
from backend.models.video import Video, TrendScore
from backend.models.product import Product, ProductListing
from backend.models.supplier import Supplier
from backend.models.hashtag import Hashtag
from backend.models.campaign import Campaign, Ad
from backend.models.crawler_job import CrawlerJob
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
rng = random.Random(42)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def rand_dt(days: int = 30) -> datetime:
    delta = timedelta(days=rng.randint(0, days), hours=rng.randint(0, 23))
    return datetime.now(timezone.utc) - delta


async def run():
    # ── Recreate schema ──────────────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Schema ready (11 tables)")

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:

        # ── Demo user ────────────────────────────────────────────────────────
        user = User(
            email="demo@viralcommerce.ai",
            hashed_password=pwd_ctx.hash("Demo1234!"),
            full_name="Demo User",
            plan="pro",
            is_active=True,
        )
        db.add(user)
        await db.flush()
        user_id = user.id
        print(f"  User: demo@viralcommerce.ai / Demo1234!")

        # ── Hashtags ─────────────────────────────────────────────────────────
        HASHTAGS = [
            ("tiktokmademebuyit", "tiktok", 8_500_000_000, 450.0),
            ("amazonfinds",       "tiktok", 3_200_000_000, 320.5),
            ("aliexpressfinds",   "tiktok", 1_800_000_000, 280.3),
            ("viralproducts",     "tiktok",   950_000_000, 195.8),
            ("musthaveproducts",  "tiktok",   720_000_000, 165.2),
            ("smarthomedecor",    "tiktok",   430_000_000, 520.1),
            ("ledlights",         "tiktok", 2_100_000_000, 340.7),
            ("espressohacks",     "tiktok",   180_000_000, 890.3),
            ("aestheticroom",   "instagram", 5_400_000_000, 210.5),
            ("homeorganization","instagram", 2_800_000_000, 185.3),
            ("skincareroutine", "instagram", 9_200_000_000, 155.8),
            ("gadgetsunder50",    "youtube",   145_000_000, 1250.4),
            ("productreview",     "youtube",   890_000_000,   95.3),
        ]
        for tag, platform, posts, velocity in HASHTAGS:
            db.add(Hashtag(tag=tag, platform=platform, post_count=posts,
                           trend_velocity=velocity, is_tracked=True))
        print(f"  {len(HASHTAGS)} hashtags")

        # ── Suppliers ────────────────────────────────────────────────────────
        SUPPLIERS = [
            ("aliexpress",       "Shenzhen TechGoods Store", 4.8, ["US","UK","CA","AU","DE"], True),
            ("aliexpress",       "BeautyPro Wholesale",       4.6, ["US","UK","FR","AU"],     True),
            ("cj_dropshipping",  "CJ Smart Home Hub",         4.9, ["US","UK","CA","DE","FR"],True),
            ("alibaba",          "GuangZhou ElectroSource",   4.7, ["US","UK","CA"],          False),
            ("temu",             "Temu Official Store",       4.4, ["US","UK"],               True),
        ]
        supplier_ids = []
        for platform, name, rating, ships_to, verified in SUPPLIERS:
            s = Supplier(platform=platform, name=name, rating=rating,
                         ships_to=ships_to, is_verified=verified)
            db.add(s)
            await db.flush()
            supplier_ids.append(s.id)
        print(f"  {len(supplier_ids)} suppliers")

        # ── Videos ──────────────────────────────────────────────────────────
        VIDEOS = [
            ("tiktok",     "This LED strip CHANGED my room",
             ["ledlights","aestheticroom","tiktokmademebuyit"],
             12_400_000, 987_000, 145_000, 23_400, 94.2, "@roomaesthetic22",   2_100_000),
            ("tiktok",     "Portable espresso = best travel hack",
             ["espresso","travelhacks","amazonfinds"],
              8_700_000, 654_000,  98_000, 18_700, 88.7, "@travelwithstyle",     890_000),
            ("instagram",  "Galaxy projector = instant spa vibes",
             ["galaxyprojector","aestheticroom","amazonfinds"],
              5_300_000, 423_000,  67_000,  9_800, 91.5, "@minimalhomedecor",  1_450_000),
            ("youtube",    "Testing VIRAL TikTok Products So You Don't Have To",
             ["viralproducts","tiktokmademebuyit","productreview"],
              3_200_000, 287_000,  45_000, 12_300, 79.3, "@TechTestLab",       4_200_000),
            ("tiktok",     "This posture brace fixed my back pain in 1 week",
             ["posturecorrector","backpain","healthhacks"],
              6_800_000, 512_000,  87_000, 15_200, 85.1, "@healthwithme",        670_000),
        ]
        video_ids = []
        for platform, title, hashtags, views, likes, shares, comments, score, handle, followers in VIDEOS:
            vid = Video(
                platform=platform,
                external_id=f"demo_{uuid.uuid4().hex[:12]}",
                url=f"https://{platform}.com/v/{uuid.uuid4().hex[:10]}",
                title=title, caption=title, hashtags=hashtags,
                views=views, likes=likes, shares=shares, comments=comments,
                viral_score=score, author_handle=handle, author_followers=followers,
                thumbnail_url=f"https://picsum.photos/seed/{uuid.uuid4().hex[:6]}/640/360",
                published_at=rand_dt(14),
            )
            db.add(vid)
            await db.flush()
            video_ids.append(vid.id)
            # 7-day trend history
            for day in range(7):
                decay = rng.uniform(0.6, 0.9) ** (7 - day)
                db.add(TrendScore(
                    video_id=vid.id,
                    viral_score=round(score * decay, 2),
                    views=int(views * decay), likes=int(likes * decay),
                    shares=int(shares * decay), comments=int(comments * decay),
                    recorded_at=datetime.now(timezone.utc) - timedelta(days=7 - day),
                ))
        print(f"  {len(video_ids)} videos + 7-day trend history")

        # ── Products ─────────────────────────────────────────────────────────
        PRODUCTS = [
            ("LED Strip Lights RGB Smart",           "Home & Garden", "Lighting",       ["led","smart home","rgb","aesthetic"],   94.2, 65.0, 88.5, 12.99, 39.99),
            ("Mini Portable Espresso Maker",          "Kitchen",       "Coffee Makers",  ["coffee","portable","espresso","travel"], 88.7, 55.0, 82.3, 24.99, 59.99),
            ("Galaxy Star Projector Night Light",     "Home & Garden", "Decor",          ["projector","stars","bedroom","aesthetic"],91.5,48.0,91.0, 18.99, 45.99),
            ("Wireless Charging Pad 3-in-1",          "Electronics",   "Chargers",       ["wireless","charging","apple","samsung"], 79.3, 72.0, 78.0, 19.99, 49.99),
            ("Posture Corrector Back Brace",          "Health & Beauty","Posture",        ["posture","health","back pain","office"], 85.1, 60.0, 84.5, 14.99, 34.99),
            ("Silicone Makeup Brush Set 10pc",        "Beauty",        "Makeup Tools",   ["makeup","beauty","brushes","silicone"],  87.6, 52.0, 86.0,  8.99, 22.99),
            ("Electric Milk Frother Handheld",        "Kitchen",       "Beverages",      ["coffee","milk frother","latte"],         73.4, 58.0, 75.5,  6.99, 15.99),
            ("Foldable Yoga Mat with Alignment Lines","Sports & Outdoors","Yoga",        ["yoga","fitness","workout","foldable"],   76.8, 64.0, 79.3, 22.99, 54.99),
        ]
        product_ids = []
        for i, (name, cat, subcat, tags, vs, cs, ds, pmin, pmax) in enumerate(PRODUCTS):
            prod = Product(
                name=name, slug=slugify(name), category=cat, subcategory=subcat,
                tags=tags, viral_score=vs, competition_score=cs, demand_score=ds,
                estimated_price_min=pmin, estimated_price_max=pmax,
                image_urls=[f"https://picsum.photos/seed/{slugify(name)[:8]}/400/400"],
                source_video_ids=[str(video_ids[i % len(video_ids)])],
                status="active", first_detected_at=rand_dt(20),
            )
            db.add(prod)
            await db.flush()
            product_ids.append(prod.id)
            # 2-3 listings per product
            for sup_id in rng.sample(supplier_ids, k=min(3, len(supplier_ids))):
                cost = rng.uniform(pmin * 0.15, pmin * 0.35)
                ship = rng.uniform(1.5, 5.0)
                sale = pmax * rng.uniform(0.7, 0.9)
                margin = ((sale - cost - ship) / sale) * 100
                db.add(ProductListing(
                    product_id=prod.id, supplier_id=sup_id,
                    supplier_url=f"https://aliexpress.com/item/{rng.randint(1_000_000, 9_999_999)}.html",
                    cost_price=round(cost, 2), shipping_cost=round(ship, 2),
                    moq=rng.choice([1, 1, 1, 5, 10]),
                    shipping_days_min=rng.randint(7, 14), shipping_days_max=rng.randint(15, 25),
                    profit_margin_pct=round(margin, 1),
                    roi_pct=round((margin / (100 - margin)) * 100, 1) if margin < 100 else 99.9,
                    in_stock=True,
                ))
        print(f"  {len(product_ids)} products with supplier listings")

        # ── Campaigns & Ads ──────────────────────────────────────────────────
        networks = ["meta", "tiktok_ads", "google"]
        camp_statuses = ["active", "active", "active", "paused", "completed"]
        for i, prod_id in enumerate(product_ids[:5]):
            network = networks[i % len(networks)]
            status  = camp_statuses[i]
            spend   = rng.uniform(50, 800)
            roas_v  = rng.uniform(0.5, 4.5)
            camp = Campaign(
                product_id=prod_id, user_id=user_id,
                name=f"{PRODUCTS[i][0][:40]} — {network.upper()}",
                network=network, status=status,
                daily_budget=rng.choice([50, 100, 150, 200]),
                total_spend=round(spend, 2), total_revenue=round(spend * roas_v, 2),
                roas=round(roas_v, 2),
                targeting={"age_min": 18, "age_max": 45, "interests": PRODUCTS[i][3]},
                started_at=rand_dt(15),
            )
            db.add(camp)
            await db.flush()
            # 10 ads per campaign
            for _ in range(10):
                ad_spend = spend / 10 * rng.uniform(0.5, 1.8)
                ad_roas  = rng.uniform(0.3, 5.0)
                imp      = int(rng.uniform(10_000, 500_000))
                clk      = int(imp * rng.uniform(0.01, 0.06))
                db.add(Ad(
                    campaign_id=camp.id, network=network,
                    external_ad_id=f"ad_{uuid.uuid4().hex[:10]}",
                    headline=f"Viral {PRODUCTS[i][0]} — Limited Stock",
                    status="active" if ad_roas > 0.8 else "paused",
                    impressions=imp, clicks=clk,
                    conversions=int(clk * rng.uniform(0.02, 0.08)),
                    spend=round(ad_spend, 2), revenue=round(ad_spend * ad_roas, 2),
                    ctr=round(clk / imp, 4) if imp else 0,
                    cpc=round(ad_spend / clk, 2) if clk else 0,
                    roas=round(ad_roas, 2),
                ))
        print("  5 campaigns + 50 ads")

        # ── Crawler Jobs ─────────────────────────────────────────────────────
        plats  = ["tiktok", "instagram", "youtube", "amazon", "pinterest"]
        j_statuses = ["completed", "completed", "failed", "running", "queued"]
        for _ in range(20):
            plat    = rng.choice(plats)
            jstatus = rng.choice(j_statuses)
            started = rand_dt(7)
            finished = started + timedelta(minutes=rng.randint(2, 12)) \
                       if jstatus not in ("running", "queued") else None
            db.add(CrawlerJob(
                platform=plat,
                job_type=rng.choice(["trending", "hashtag_scan"]),
                target=rng.choice(["tiktokmademebuyit", "amazonfinds", None, None]),
                status=jstatus,
                videos_found=rng.randint(50, 500) if jstatus == "completed" else 0,
                error_msg="spider error" if jstatus == "failed" else None,
                started_at=started, finished_at=finished,
            ))
        print("  20 crawler jobs")

        await db.commit()

    await engine.dispose()
    print()
    print("Seed complete!")
    print("  Login: demo@viralcommerce.ai  /  Demo1234!")
    print("  API:   http://localhost:8000/docs")
    print("  App:   http://localhost:3000")


asyncio.run(run())
