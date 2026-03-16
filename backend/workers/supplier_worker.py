"""
Supplier Worker — Celery tasks for async supplier discovery and profit analysis
"""
import logging
from datetime import datetime, timezone

from backend.workers.celery_app import app

log = logging.getLogger(__name__)


@app.task(bind=True, max_retries=3, name="backend.workers.supplier_worker.discover_suppliers_task")
def discover_suppliers_task(self, product_id: str):
    """
    Celery task that discovers suppliers for a product and saves results to DB.
    Called after a new viral product is detected.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from backend.core.config import settings
    from backend.models.product import Product, ProductListing
    from backend.models.supplier import Supplier
    from backend.services.supplier.discovery import SupplierDiscoveryService

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                from uuid import UUID
                product = await db.get(Product, UUID(product_id))
                if not product:
                    log.warning(f"Product {product_id} not found")
                    return

                service = SupplierDiscoveryService()
                results = await service.discover(
                    product_name=product.name,
                    category=product.category,
                    target_price=float(product.estimated_price_max or 50),
                )

                for result in results[:10]:  # Save top 10 suppliers
                    # Upsert supplier
                    from sqlalchemy import select
                    stmt = select(Supplier).where(
                        Supplier.platform == result.platform,
                        Supplier.external_id == result.supplier_id,
                    )
                    existing = (await db.execute(stmt)).scalar_one_or_none()

                    if existing:
                        supplier = existing
                        supplier.name = result.supplier_name
                        supplier.rating = result.rating
                    else:
                        supplier = Supplier(
                            platform=result.platform,
                            external_id=result.supplier_id,
                            name=result.supplier_name,
                            rating=result.rating,
                            is_verified=result.is_verified,
                        )
                        db.add(supplier)
                        await db.flush()

                    # Create product listing
                    listing = ProductListing(
                        product_id=product.id,
                        supplier_id=supplier.id,
                        cost_price=result.unit_price,
                        shipping_cost=result.shipping_cost,
                        moq=result.moq,
                        lead_time_days=result.lead_time_days,
                        profit_margin_pct=result.profit_margin_pct,
                        roi_pct=result.roi_pct,
                        source_url=result.product_url,
                    )
                    db.add(listing)

                await db.commit()
                log.info(f"Saved {len(results)} supplier listings for product {product_id}")

            except Exception as exc:
                log.error(f"Supplier discovery task failed: {exc}")
                await db.rollback()
                raise self.retry(exc=exc, countdown=120)
            finally:
                await engine.dispose()

    asyncio.run(_run())


@app.task(name="backend.workers.supplier_worker.refresh_all_suppliers_task")
def refresh_all_suppliers_task():
    """Refresh supplier listings for all tracked viral products."""
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import select
    from backend.core.config import settings
    from backend.models.product import Product

    async def _run():
        engine = create_async_engine(settings.DATABASE_URL)
        Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with Session() as db:
            try:
                stmt = select(Product).where(
                    Product.viral_score >= 70,
                    Product.is_active == True,
                ).limit(50)
                products = (await db.execute(stmt)).scalars().all()

                for product in products:
                    discover_suppliers_task.delay(str(product.id))

                log.info(f"Queued supplier refresh for {len(products)} viral products")
            finally:
                await engine.dispose()

    asyncio.run(_run())
