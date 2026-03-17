"""
Shopify Integration — import products to user's Shopify store.
Requires SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in user settings or env.
"""
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.product import Product
from backend.core.config import settings
from sqlalchemy import select

router = APIRouter()


class ShopifyImportRequest(BaseModel):
    product_id: str
    shopify_store_url: str   # e.g. "my-store.myshopify.com"
    shopify_access_token: str


class ShopifyTestRequest(BaseModel):
    shopify_store_url: str
    shopify_access_token: str


@router.post("/test-connection")
async def test_shopify_connection(req: ShopifyTestRequest):
    """Test if Shopify credentials are valid."""
    url = f"https://{req.shopify_store_url.strip('/')}/admin/api/2024-01/shop.json"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                url,
                headers={
                    "X-Shopify-Access-Token": req.shopify_access_token,
                    "Content-Type": "application/json",
                },
            )
        if resp.status_code == 200:
            shop = resp.json().get("shop", {})
            return {
                "success": True,
                "shop_name": shop.get("name", "Unknown"),
                "shop_email": shop.get("email", ""),
                "shop_domain": shop.get("domain", ""),
            }
        elif resp.status_code == 401:
            raise HTTPException(401, "Token de acesso Shopify inválido")
        else:
            raise HTTPException(400, f"Erro ao conectar com Shopify: {resp.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(504, "Timeout ao conectar com Shopify. Verifique a URL da loja.")
    except httpx.ConnectError:
        raise HTTPException(503, "Não foi possível conectar ao Shopify. Verifique a URL da loja.")


@router.post("/import-product")
async def import_product_to_shopify(req: ShopifyImportRequest, db: AsyncSession = Depends(get_db)):
    """Import a product from ViralCommerce to Shopify."""
    # Fetch product from DB
    result = await db.execute(select(Product).where(Product.id == req.product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(404, "Produto não encontrado")

    # Build Shopify product payload
    price = float(product.estimated_price_max or product.estimated_price_min or 0) * 3  # 3x markup
    compare_price = price * 1.2  # "was" price

    shopify_product = {
        "product": {
            "title": product.name,
            "body_html": f"<p>{product.description or product.name}</p><p><strong>Produto viral com score {product.viral_score}/100 no ViralCommerce AI.</strong></p>",
            "vendor": "ViralCommerce AI",
            "product_type": product.category or "Geral",
            "tags": f"viral, dropshipping, {product.category or ''}, viralcommerce",
            "status": "draft",  # Draft so user can review before publishing
            "variants": [
                {
                    "price": f"{price:.2f}",
                    "compare_at_price": f"{compare_price:.2f}",
                    "inventory_management": None,
                    "fulfillment_service": "manual",
                    "requires_shipping": True,
                    "taxable": True,
                }
            ],
            "images": [
                {"src": url}
                for url in (product.image_urls or [])[:5]
                if url
            ],
        }
    }

    # Post to Shopify API
    url = f"https://{req.shopify_store_url.strip('/')}/admin/api/2024-01/products.json"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                json=shopify_product,
                headers={
                    "X-Shopify-Access-Token": req.shopify_access_token,
                    "Content-Type": "application/json",
                },
            )

        if resp.status_code in (200, 201):
            created = resp.json().get("product", {})
            shop_domain = req.shopify_store_url.replace(".myshopify.com", "")
            return {
                "success": True,
                "shopify_product_id": created.get("id"),
                "shopify_url": f"https://{req.shopify_store_url}/admin/products/{created.get('id')}",
                "admin_url": f"https://admin.shopify.com/store/{shop_domain}/products/{created.get('id')}",
                "title": created.get("title"),
                "status": created.get("status"),
            }
        elif resp.status_code == 401:
            raise HTTPException(401, "Token de acesso Shopify inválido")
        elif resp.status_code == 422:
            errors = resp.json().get("errors", {})
            raise HTTPException(422, f"Dados inválidos para Shopify: {errors}")
        else:
            raise HTTPException(400, f"Erro Shopify: {resp.status_code} — {resp.text[:200]}")

    except httpx.TimeoutException:
        raise HTTPException(504, "Timeout ao enviar produto para Shopify.")
    except httpx.ConnectError:
        raise HTTPException(503, "Não foi possível conectar ao Shopify.")
