"""
Campaign Worker — Celery tasks for campaign launch and optimization
"""
import logging
from datetime import datetime, timezone

from backend.workers.celery_app import app

log = logging.getLogger(__name__)


@app.task(bind=True, max_retries=2, name="backend.workers.campaign_worker.launch_campaign_task")
def launch_campaign_task(self, campaign_id: str, product_id: str):
    """
    Celery task that launches a campaign on ad networks.
    Creates 10 AI-generated ad variations and starts them at $5/day each.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from backend.core.config import settings
    from backend.models.campaign import Campaign, Ad
    from backend.models.product import Product

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                from uuid import UUID
                campaign = await db.get(Campaign, UUID(campaign_id))
                product = await db.get(Product, UUID(product_id))
                if not campaign or not product:
                    log.error(f"Campaign {campaign_id} or Product {product_id} not found")
                    return

                campaign.status = "launching"
                await db.commit()

                from backend.services.campaigns.optimizer import CampaignOptimizer
                optimizer = CampaignOptimizer()
                result = await optimizer.launch(
                    campaign_id=campaign_id,
                    product=product,
                    network=campaign.network,
                    daily_budget=float(campaign.daily_budget or 50),
                    targeting=campaign.targeting or {},
                )

                campaign.status = "active"
                campaign.external_campaign_id = result.get("external_id")
                campaign.started_at = datetime.now(timezone.utc)
                await db.commit()

                log.info(f"Campaign {campaign_id} launched with {len(result.get('ads', []))} ads")

            except Exception as exc:
                log.error(f"Campaign launch failed: {exc}")
                if campaign:
                    campaign.status = "failed"
                    await db.commit()
                raise self.retry(exc=exc, countdown=300)
            finally:
                await engine.dispose()

    asyncio.run(_run())


@app.task(bind=True, max_retries=2, name="backend.workers.campaign_worker.optimize_campaign_task")
def optimize_campaign_task(self, campaign_id: str):
    """
    Optimize a single campaign: kill ROAS < 0.8 ads, scale ROAS > 2.5 ads.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import select
    from backend.core.config import settings
    from backend.models.campaign import Campaign, Ad

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                from uuid import UUID
                campaign = await db.get(Campaign, UUID(campaign_id))
                if not campaign or campaign.status != "active":
                    return

                # Load ads for this campaign
                stmt = select(Ad).where(Ad.campaign_id == campaign.id)
                ads = (await db.execute(stmt)).scalars().all()

                from backend.services.campaigns.optimizer import CampaignOptimizer
                optimizer = CampaignOptimizer()

                killed = 0
                scaled = 0

                for ad in ads:
                    if ad.status != "active":
                        continue

                    spend = float(ad.spend or 0)
                    roas = float(ad.roas or 0)

                    # Need at least $10 spend to evaluate
                    if spend < 10:
                        continue

                    if roas < 0.8:
                        await optimizer.kill_ad(campaign.network, str(ad.external_ad_id))
                        ad.status = "paused"
                        killed += 1

                    elif roas > 2.5:
                        current_budget = float(ad.daily_budget or 5)
                        new_budget = min(current_budget * 2, 500)  # Cap at $500/day
                        await optimizer.scale_ad(
                            campaign.network,
                            str(ad.external_ad_id),
                            new_budget,
                        )
                        ad.daily_budget = new_budget
                        scaled += 1

                # Recalculate campaign-level ROAS
                active_ads = [a for a in ads if a.status == "active"]
                if active_ads:
                    total_spend = sum(float(a.spend or 0) for a in active_ads)
                    total_revenue = sum(float(a.revenue or 0) for a in active_ads)
                    campaign.total_spend = total_spend
                    campaign.total_revenue = total_revenue
                    campaign.roas = (total_revenue / total_spend) if total_spend > 0 else 0

                await db.commit()
                log.info(
                    f"Campaign {campaign_id} optimized — "
                    f"killed={killed}, scaled={scaled}, active={len(active_ads)}"
                )

            except Exception as exc:
                log.error(f"Campaign optimization failed: {exc}")
                raise self.retry(exc=exc, countdown=180)
            finally:
                await engine.dispose()

    asyncio.run(_run())


@app.task(name="backend.workers.campaign_worker.optimize_all_campaigns_task")
def optimize_all_campaigns_task():
    """
    Beat task: Optimize all active campaigns every 6 hours.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import select
    from backend.core.config import settings
    from backend.models.campaign import Campaign

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                stmt = select(Campaign).where(Campaign.status == "active")
                campaigns = (await db.execute(stmt)).scalars().all()

                for campaign in campaigns:
                    optimize_campaign_task.delay(str(campaign.id))

                log.info(f"Queued optimization for {len(campaigns)} active campaigns")
            finally:
                await engine.dispose()

    asyncio.run(_run())
