"""
Marketing API — AI-generated marketing assets
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.product import Product
from backend.services.marketing.generator import MarketingGeneratorService

router = APIRouter()


@router.post("/generate")
async def generate_assets(
    product_id: UUID,
    asset_types: list[str] = ["headline", "description", "hook", "tiktok_script", "caption"],
    tone: str = "engaging",
    language: str = "en",
    db: AsyncSession = Depends(get_db),
):
    """Generate marketing assets for any product."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    gen = MarketingGeneratorService()
    return await gen.generate_all(product=product, asset_types=asset_types, tone=tone, language=language)


@router.post("/landing-page")
async def generate_landing_page(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Generate a full landing page copy."""
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    gen = MarketingGeneratorService()
    return await gen.generate_landing_page(product=product)
