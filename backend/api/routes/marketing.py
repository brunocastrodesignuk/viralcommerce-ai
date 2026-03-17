"""
Marketing API — AI-generated marketing assets
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.product import Product
from backend.services.marketing.generator import MarketingGeneratorService

router = APIRouter()


class FreeTextGenerateRequest(BaseModel):
    name: str
    category: str = "General"
    description: str = ""
    sale_price: float = 29.99
    cost_price: float = 8.50
    target_audience: str = "general consumers"
    tone: str = "engaging"
    language: str = "pt"
    asset_types: list[str] = ["headline", "description", "hook", "tiktok_script", "caption", "email_subject"]


class _FreeProduct:
    """Lightweight product-like object for free-text generation."""
    def __init__(self, name: str, category: str, description: str, sale_price: float, cost_price: float):
        self.name = name
        self.category = category
        self.description = description
        self.best_listing = _FakeListing(cost_price, sale_price)


class _FakeListing:
    def __init__(self, cost_price: float, sale_price: float):
        self.cost_price = cost_price
        self.sale_price_suggested = sale_price


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


@router.post("/generate-free")
async def generate_assets_free(body: FreeTextGenerateRequest):
    """Generate marketing assets from free-text product description (no product_id needed)."""
    product = _FreeProduct(
        name=body.name,
        category=body.category,
        description=body.description,
        sale_price=body.sale_price,
        cost_price=body.cost_price,
    )
    gen = MarketingGeneratorService()
    results = await gen.generate_all(
        product=product,
        asset_types=body.asset_types,
        tone=body.tone,
        language=body.language,
    )
    return {"assets": results, "product": {"name": body.name, "category": body.category}}


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
