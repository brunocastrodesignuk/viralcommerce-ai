"""
Suppliers API — supplier discovery and profit analysis
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.supplier import Supplier
from backend.models.product import ProductListing

router = APIRouter()


@router.get("/")
async def list_suppliers(
    platform: str = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Supplier)
    if platform:
        query = query.where(Supplier.platform == platform)
    result = await db.scalars(query.order_by(desc(Supplier.rating)).limit(limit))
    return result.all()


@router.get("/{supplier_id}")
async def get_supplier(supplier_id: UUID, db: AsyncSession = Depends(get_db)):
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(404, "Supplier not found")
    return supplier


@router.get("/{supplier_id}/listings")
async def supplier_listings(
    supplier_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(ProductListing)
        .where(ProductListing.supplier_id == supplier_id)
        .order_by(desc(ProductListing.profit_margin_pct))
    )
    return result.all()
