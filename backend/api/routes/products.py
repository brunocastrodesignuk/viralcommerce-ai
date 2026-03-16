"""
Products API — viral product discovery, search, and management
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.product import Product, ProductListing
from backend.api.schemas.product import (
    ProductOut,
    ProductListOut,
    ProductDetailOut,
    ProductSearchParams,
)
from backend.services.supplier.discovery import SupplierDiscoveryService
from backend.services.marketing.generator import MarketingGeneratorService
from backend.services.ai.virality import ViralityScorer

router = APIRouter()


@router.get("/", response_model=ProductListOut)
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    min_viral_score: float = Query(0, ge=0, le=100),
    sort_by: str = Query("viral_score", enum=["viral_score", "profit_margin", "updated_at"]),
    db: AsyncSession = Depends(get_db),
):
    """List viral products with filtering and sorting."""
    query = select(Product).where(
        Product.status == "active",
        Product.viral_score >= min_viral_score,
    )
    if category:
        query = query.where(Product.category == category)

    sort_col = {
        "viral_score": desc(Product.viral_score),
        "updated_at": desc(Product.updated_at),
    }.get(sort_by, desc(Product.viral_score))

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    products = await db.scalars(
        query.order_by(sort_col).offset((page - 1) * limit).limit(limit)
    )
    return {"total": total, "page": page, "limit": limit, "items": products.all()}


@router.get("/trending", response_model=list[ProductOut])
async def trending_products(
    hours: int = Query(24, ge=1, le=168),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Top trending products in the last N hours."""
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.scalars(
        select(Product)
        .where(Product.first_detected_at >= cutoff, Product.status == "active")
        .order_by(desc(Product.viral_score))
        .limit(limit)
    )
    return result.all()


@router.get("/{product_id}", response_model=ProductDetailOut)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get full product details including listings and suppliers."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_id}/suppliers")
async def get_product_suppliers(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get supplier listings for a product with profit analysis."""
    listings = await db.scalars(
        select(ProductListing)
        .where(ProductListing.product_id == product_id)
        .order_by(desc(ProductListing.profit_margin_pct))
    )
    return listings.all()


@router.post("/{product_id}/find-suppliers")
async def trigger_supplier_search(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Trigger async supplier discovery for a product."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    service = SupplierDiscoveryService()
    task = await service.search_async(product_id=str(product_id), product_name=product.name)
    return {"task_id": task.id, "status": "queued"}


@router.post("/{product_id}/generate-marketing")
async def generate_marketing(
    product_id: UUID,
    asset_types: list[str] = ["headline", "description", "hook", "tiktok_script"],
    db: AsyncSession = Depends(get_db),
):
    """Generate AI marketing assets for a product."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    gen = MarketingGeneratorService()
    assets = await gen.generate_all(product=product, asset_types=asset_types)
    return {"product_id": product_id, "assets": assets}


@router.get("/{product_id}/viral-history")
async def viral_history(product_id: UUID, days: int = Query(7, ge=1, le=30)):
    """Get viral score history from ClickHouse."""
    from backend.core.database import get_clickhouse
    ch = get_clickhouse()
    rows = ch.execute(
        """
        SELECT event_time, viral_score, video_count, mention_count
        FROM product_trend_events
        WHERE product_id = %(pid)s
          AND event_time >= now() - INTERVAL %(days)s DAY
        ORDER BY event_time
        """,
        {"pid": str(product_id), "days": days},
    )
    return [
        {"time": r[0], "viral_score": r[1], "video_count": r[2], "mention_count": r[3]}
        for r in rows
    ]
