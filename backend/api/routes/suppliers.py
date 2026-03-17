"""
Suppliers API — supplier discovery and profit analysis
Returns real DB data when available, rich mock data as fallback.
"""
import random
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.supplier import Supplier
from backend.models.product import ProductListing

router = APIRouter()

# ─── Platform homepage / search URLs (always valid & working) ─────────────────
_PLATFORM_URLS = {
    "aliexpress":      "https://www.aliexpress.com/wholesale?SearchText=dropshipping+trending",
    "alibaba":         "https://www.alibaba.com/trade/search?SearchText=dropshipping",
    "cj_dropshipping": "https://app.cjdropshipping.com/",
    "temu":            "https://www.temu.com/channel/best-sellers.html",
    "amazon":          "https://affiliate-program.amazon.com",
    "shein":           "https://www.shein.com/pdsearch/",
}

# ─── High-fidelity mock supplier data ────────────────────────────────────────
_MOCK_SUPPLIERS = [
    {
        "id": "sup-001",
        "platform": "aliexpress",
        "name": "Top Beauty & Care Store",
        "rating": 4.8,
        "is_verified": True,
        "ships_to": ["US", "CA", "AU", "UK", "DE", "FR"],
        "store_url": "https://www.aliexpress.com/wholesale?SearchText=beauty+care+skincare&SortType=total_tranpro_desc",
        "listings": [
            {
                "id": "lst-001", "product_name": "Oval Face Framing Glasses Anti Blue Light",
                "cost_price": 8.99, "shipping_cost": 1.99, "moq": 1,
                "profit_margin_pct": 72.5, "lead_time_days": 15,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Oval+Face+Framing+Glasses+Anti+Blue+Light&SortType=SALE_PRICE_ASC",
            },
            {
                "id": "lst-002", "product_name": "LED Face Mask Photon Therapy",
                "cost_price": 22.50, "shipping_cost": 3.50, "moq": 1,
                "profit_margin_pct": 68.3, "lead_time_days": 18,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=LED+Face+Mask+Photon+Therapy&SortType=SALE_PRICE_ASC",
            },
            {
                "id": "lst-003", "product_name": "Snail Mucin Serum 96%",
                "cost_price": 6.80, "shipping_cost": 1.50, "moq": 5,
                "profit_margin_pct": 74.1, "lead_time_days": 12,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Snail+Mucin+Serum+96%25&SortType=SALE_PRICE_ASC",
            },
        ],
    },
    {
        "id": "sup-002",
        "platform": "cj_dropshipping",
        "name": "CJ Fashion & Electronics Hub",
        "rating": 4.6,
        "is_verified": True,
        "ships_to": ["US", "CA", "AU", "UK", "BR", "MX"],
        "store_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Cloud+Slippers",
        "listings": [
            {
                "id": "lst-004", "product_name": "Cloud Slippers Thick Sole Platform",
                "cost_price": 12.40, "shipping_cost": 2.80, "moq": 1,
                "profit_margin_pct": 65.8, "lead_time_days": 7,
                "product_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Cloud+Slippers+Thick+Sole+Platform",
            },
            {
                "id": "lst-005", "product_name": "Cottagecore Floral Hair Claw Clips Set",
                "cost_price": 3.20, "shipping_cost": 1.20, "moq": 3,
                "profit_margin_pct": 78.4, "lead_time_days": 8,
                "product_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Cottagecore+Floral+Hair+Claw+Clips+Set",
            },
            {
                "id": "lst-006", "product_name": "Magnetic MagSafe Phone Wallet",
                "cost_price": 4.90, "shipping_cost": 1.10, "moq": 2,
                "profit_margin_pct": 76.2, "lead_time_days": 6,
                "product_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Magnetic+MagSafe+Phone+Wallet",
            },
        ],
    },
    {
        "id": "sup-003",
        "platform": "aliexpress",
        "name": "TechGadget Pro Wholesale",
        "rating": 4.7,
        "is_verified": True,
        "ships_to": ["US", "CA", "UK", "AU", "SG", "NZ"],
        "store_url": "https://www.aliexpress.com/wholesale?SearchText=gadget+tech+electronics&SortType=total_tranpro_desc",
        "listings": [
            {
                "id": "lst-007", "product_name": "Portable Neck Fan Mini Air Conditioner",
                "cost_price": 14.20, "shipping_cost": 2.60, "moq": 1,
                "profit_margin_pct": 63.7, "lead_time_days": 20,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Portable+Neck+Fan+Mini+Air+Conditioner&SortType=SALE_PRICE_ASC",
            },
            {
                "id": "lst-008", "product_name": "Digital Retro Flip LED Alarm Clock",
                "cost_price": 11.80, "shipping_cost": 3.20, "moq": 1,
                "profit_margin_pct": 66.4, "lead_time_days": 22,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Digital+Retro+Flip+LED+Alarm+Clock&SortType=SALE_PRICE_ASC",
            },
        ],
    },
    {
        "id": "sup-004",
        "platform": "alibaba",
        "name": "Shenzhen Beauty Factory Direct",
        "rating": 4.5,
        "is_verified": False,
        "ships_to": ["US", "CA", "AU", "UK", "DE", "FR", "JP"],
        "store_url": "https://www.alibaba.com/trade/search?SearchText=beauty+cosmetics+skincare&type=supplier",
        "listings": [
            {
                "id": "lst-009", "product_name": "Korean Glass Skin Sunscreen SPF50+",
                "cost_price": 5.40, "shipping_cost": 2.10, "moq": 50,
                "profit_margin_pct": 79.8, "lead_time_days": 25,
                "product_url": "https://www.alibaba.com/trade/search?SearchText=Korean+Glass+Skin+Sunscreen+SPF50%2B",
            },
            {
                "id": "lst-010", "product_name": "Hailey Bieber Glazed Donut Lip Balm",
                "cost_price": 2.90, "shipping_cost": 1.80, "moq": 100,
                "profit_margin_pct": 82.3, "lead_time_days": 30,
                "product_url": "https://www.alibaba.com/trade/search?SearchText=Hailey+Bieber+Glazed+Donut+Lip+Balm",
            },
            {
                "id": "lst-011", "product_name": "Press-On Nails Kit Professional 500pcs",
                "cost_price": 4.20, "shipping_cost": 2.40, "moq": 20,
                "profit_margin_pct": 77.6, "lead_time_days": 28,
                "product_url": "https://www.alibaba.com/trade/search?SearchText=Press-On+Nails+Kit+Professional+500pcs",
            },
        ],
    },
    {
        "id": "sup-005",
        "platform": "cj_dropshipping",
        "name": "Home & Lifestyle Dropship Co.",
        "rating": 4.4,
        "is_verified": True,
        "ships_to": ["US", "CA", "UK", "AU", "NZ"],
        "store_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Matcha+Whisk+Set",
        "listings": [
            {
                "id": "lst-012", "product_name": "Matcha Whisk Set Bamboo Traditional",
                "cost_price": 7.60, "shipping_cost": 1.90, "moq": 1,
                "profit_margin_pct": 70.2, "lead_time_days": 9,
                "product_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Matcha+Whisk+Set+Bamboo+Traditional",
            },
            {
                "id": "lst-013", "product_name": "Stanley-Style Quencher Tumbler 40oz",
                "cost_price": 10.20, "shipping_cost": 3.80, "moq": 1,
                "profit_margin_pct": 62.8, "lead_time_days": 10,
                "product_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Stanley-Style+Quencher+Tumbler+40oz",
            },
            {
                "id": "lst-014", "product_name": "Portable Espresso Machine Handheld",
                "cost_price": 18.90, "shipping_cost": 4.20, "moq": 1,
                "profit_margin_pct": 61.4, "lead_time_days": 14,
                "product_url": "https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn=Portable+Espresso+Machine+Handheld",
            },
        ],
    },
    {
        "id": "sup-006",
        "platform": "aliexpress",
        "name": "Health & Wellness Global Store",
        "rating": 4.6,
        "is_verified": True,
        "ships_to": ["US", "CA", "AU", "UK", "IE"],
        "store_url": "https://www.aliexpress.com/wholesale?SearchText=health+wellness+fitness&SortType=total_tranpro_desc",
        "listings": [
            {
                "id": "lst-015", "product_name": "Ice Roller Face Lymphatic Drainage",
                "cost_price": 5.20, "shipping_cost": 1.40, "moq": 1,
                "profit_margin_pct": 75.9, "lead_time_days": 13,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Ice+Roller+Face+Lymphatic+Drainage&SortType=SALE_PRICE_ASC",
            },
            {
                "id": "lst-016", "product_name": "Teeth Whitening Kit LED 35% CP",
                "cost_price": 9.80, "shipping_cost": 2.20, "moq": 2,
                "profit_margin_pct": 71.3, "lead_time_days": 16,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Teeth+Whitening+Kit+LED+35%25+CP&SortType=SALE_PRICE_ASC",
            },
            {
                "id": "lst-017", "product_name": "Posture Corrector Smart Bluetooth",
                "cost_price": 16.40, "shipping_cost": 3.60, "moq": 1,
                "profit_margin_pct": 64.7, "lead_time_days": 19,
                "product_url": "https://www.aliexpress.com/wholesale?SearchText=Posture+Corrector+Smart+Bluetooth&SortType=SALE_PRICE_ASC",
            },
        ],
    },
    {
        "id": "sup-007",
        "platform": "amazon",
        "name": "Amazon — Programa de Afiliados (Associates)",
        "rating": 4.9,
        "is_verified": True,
        "ships_to": ["US", "CA", "UK", "DE", "FR", "IT", "ES", "JP", "AU", "BR"],
        "store_url": "https://affiliate-program.amazon.com",
        "commission_model": True,
        "commission_rate_pct": 10.0,
        "listings": [
            {
                "id": "lst-018", "product_name": "Trending Gadgets & Electronics",
                "cost_price": 0, "shipping_cost": 0, "moq": 0,
                "profit_margin_pct": 10.0, "lead_time_days": 0,
                "note": "Comissão de afiliado — sem custo de estoque",
                "product_url": "https://www.amazon.com/s?k=Trending+Gadgets+Electronics&tag=viralcommerce-20",
            },
            {
                "id": "lst-019", "product_name": "Beleza & Cuidados Pessoais",
                "cost_price": 0, "shipping_cost": 0, "moq": 0,
                "profit_margin_pct": 10.0, "lead_time_days": 0,
                "note": "Comissão de afiliado — sem custo de estoque",
                "product_url": "https://www.amazon.com/s?k=Beleza+Cuidados+Pessoais&tag=viralcommerce-20",
            },
            {
                "id": "lst-020", "product_name": "Casa, Cozinha & Esportes",
                "cost_price": 0, "shipping_cost": 0, "moq": 0,
                "profit_margin_pct": 8.0, "lead_time_days": 0,
                "note": "Comissão de afiliado — sem custo de estoque",
                "product_url": "https://www.amazon.com/s?k=Casa+Cozinha+Esportes&tag=viralcommerce-20",
            },
        ],
    },
    {
        "id": "sup-008",
        "platform": "temu",
        "name": "Temu — Best Sellers Dropship",
        "rating": 4.3,
        "is_verified": True,
        "ships_to": ["US", "CA", "UK", "AU", "DE", "FR", "NL"],
        "store_url": "https://www.temu.com/channel/best-sellers.html",
        "listings": [
            {
                "id": "lst-021", "product_name": "Aesthetic Room Decor Set LED",
                "cost_price": 5.99, "shipping_cost": 0, "moq": 1,
                "profit_margin_pct": 69.5, "lead_time_days": 10,
                "product_url": "https://www.temu.com/search_result.html?search_key=Aesthetic+Room+Decor+Set+LED",
            },
            {
                "id": "lst-022", "product_name": "Mini Portable Blender Juicer",
                "cost_price": 8.50, "shipping_cost": 0, "moq": 1,
                "profit_margin_pct": 66.1, "lead_time_days": 12,
                "product_url": "https://www.temu.com/search_result.html?search_key=Mini+Portable+Blender+Juicer",
            },
        ],
    },
    {
        "id": "sup-009",
        "platform": "shein",
        "name": "SHEIN — Moda & Lifestyle Viral",
        "rating": 4.2,
        "is_verified": True,
        "ships_to": ["US", "CA", "UK", "AU", "BR", "MX", "FR", "DE", "IT"],
        "store_url": "https://www.shein.com/New-in-Clothes-sc-00278522.html",
        "listings": [
            {
                "id": "lst-023", "product_name": "SHEIN Tie Dye Crop Top Trendy Y2K",
                "cost_price": 7.99, "shipping_cost": 2.99, "moq": 1,
                "profit_margin_pct": 71.8, "lead_time_days": 14,
                "product_url": "https://www.shein.com/pdsearch/tie+dye+crop+top/?ici=s_pdsearch_btn",
            },
            {
                "id": "lst-024", "product_name": "SHEIN Minimalist Gold Chain Necklace",
                "cost_price": 4.49, "shipping_cost": 1.99, "moq": 1,
                "profit_margin_pct": 74.2, "lead_time_days": 14,
                "product_url": "https://www.shein.com/pdsearch/gold+chain+necklace/?ici=s_pdsearch_btn",
            },
            {
                "id": "lst-025", "product_name": "SHEIN Aesthetic LED Fairy Light Room Decor",
                "cost_price": 6.99, "shipping_cost": 2.49, "moq": 1,
                "profit_margin_pct": 69.3, "lead_time_days": 16,
                "product_url": "https://www.shein.com/pdsearch/fairy+light+room+decor/?ici=s_pdsearch_btn",
            },
        ],
    },
    {
        "id": "sup-010",
        "platform": "shein",
        "name": "SHEIN Beauty & Skincare Studio",
        "rating": 4.1,
        "is_verified": True,
        "ships_to": ["US", "CA", "UK", "AU", "BR", "MX"],
        "store_url": "https://www.shein.com/Beauty.html",
        "listings": [
            {
                "id": "lst-026", "product_name": "SHEIN Vitamin C Brightening Serum 30ml",
                "cost_price": 5.99, "shipping_cost": 1.99, "moq": 2,
                "profit_margin_pct": 72.5, "lead_time_days": 15,
                "product_url": "https://www.shein.com/pdsearch/vitamin+c+serum/?ici=s_pdsearch_btn",
            },
            {
                "id": "lst-027", "product_name": "SHEIN Velvet Makeup Bag Set 3-Piece",
                "cost_price": 8.99, "shipping_cost": 2.49, "moq": 1,
                "profit_margin_pct": 68.7, "lead_time_days": 13,
                "product_url": "https://www.shein.com/pdsearch/makeup+bag+set/?ici=s_pdsearch_btn",
            },
        ],
    },
]


import re as _re

def _clean_store_url(url: str | None, fallback: str) -> str:
    """Return a real working store URL — reject obvious placeholder store IDs."""
    if not url:
        return fallback
    # Detect fake placeholder patterns: /store/1234567 or /store/12345678
    if _re.search(r"/store/\d{5,}", url):
        return fallback
    # Detect URLs that are just a bare domain with no path (e.g. aliexpress.com)
    if _re.match(r"^https?://[^/]+/?$", url):
        return fallback
    return url


def _serialize_supplier(s: Supplier, listings: list) -> dict:
    """Convert DB Supplier + its listings into the shape the frontend expects."""
    # Use platform homepage URL as fallback if supplier has no specific URL
    fallback_url = _PLATFORM_URLS.get(s.platform or "", "")
    return {
        "id": str(s.id),
        "platform": s.platform,
        "name": s.name,
        "rating": float(s.rating) if s.rating else 0,
        "is_verified": s.is_verified,
        "ships_to": s.ships_to or [],
        "store_url": _clean_store_url(s.url, fallback_url),   # validate: reject fake store IDs
        "listings": [
            {
                "id": str(lst.id),
                "product_name": lst.supplier_sku or "Produto do Fornecedor",
                "cost_price": float(lst.cost_price),
                "shipping_cost": float(lst.shipping_cost or 0),
                "moq": lst.moq or 1,
                "profit_margin_pct": float(lst.profit_margin_pct or 0),
                "lead_time_days": lst.shipping_days_max or 14,
            }
            for lst in listings
        ],
    }


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
    suppliers = result.all()

    if suppliers:
        # Fetch listings for each supplier and serialize properly
        out = []
        for s in suppliers:
            listings_result = await db.scalars(
                select(ProductListing)
                .where(ProductListing.supplier_id == s.id)
                .order_by(desc(ProductListing.profit_margin_pct))
                .limit(5)
            )
            out.append(_serialize_supplier(s, list(listings_result.all())))
        return out

    # ── Fallback: return rich mock supplier data ──────────────────────────
    mock = _MOCK_SUPPLIERS
    if platform and platform != "all":
        mock = [s for s in mock if s["platform"] == platform]
    return mock[:limit]


@router.get("/search/live")
async def live_supplier_search(
    q: str = Query(..., min_length=2, description="Product name to search"),
    platforms: str = Query("aliexpress,cj,shein", description="Comma-separated platforms"),
):
    """
    Search multiple supplier platforms in real-time for a specific product.
    Returns matched products with real/estimated prices and direct product URLs.
    """
    import urllib.parse
    results = []
    platform_list = [p.strip() for p in platforms.split(",")]
    encoded_q = urllib.parse.quote_plus(q)

    if "aliexpress" in platform_list:
        results.append({
            "platform": "aliexpress",
            "supplier_name": "AliExpress Top Sellers",
            "product_url": f"https://www.aliexpress.com/wholesale?SearchText={encoded_q}&SortType=SALE_PRICE_ASC",
            "search_url": f"https://www.aliexpress.com/wholesale?SearchText={encoded_q}",
            "estimated_cost_min": None,
            "estimated_cost_max": None,
            "note": "Clique para ver preços reais no AliExpress",
        })

    if "shein" in platform_list:
        from backend.services.supplier.shein_fetcher import search_shein_products
        shein_results = search_shein_products(q, max_results=3)
        for r in shein_results:
            results.append({
                **r,
                "search_url": f"https://www.shein.com/pdsearch/{encoded_q}/?ici=s_pdsearch_btn",
            })

    if "temu" in platform_list:
        results.append({
            "platform": "temu",
            "supplier_name": "Temu Best Sellers",
            "product_url": f"https://www.temu.com/search_result.html?search_key={encoded_q}",
            "search_url": f"https://www.temu.com/search_result.html?search_key={encoded_q}",
            "estimated_cost_min": None,
            "estimated_cost_max": None,
            "note": "Clique para ver preços reais no Temu",
        })

    if "cj" in platform_list:
        results.append({
            "platform": "cj_dropshipping",
            "supplier_name": "CJ Dropshipping",
            "product_url": f"https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn={encoded_q}",
            "search_url": f"https://app.cjdropshipping.com/?_locale=en#/productPage?productNameEn={encoded_q}",
            "estimated_cost_min": None,
            "estimated_cost_max": None,
            "note": "Clique para ver preços reais no CJ",
        })

    return {"query": q, "results": results}


@router.get("/{supplier_id}")
async def get_supplier(supplier_id: str, db: AsyncSession = Depends(get_db)):
    # Try UUID lookup first
    try:
        uid = UUID(supplier_id)
        supplier = await db.get(Supplier, uid)
        if supplier:
            return supplier
    except ValueError:
        pass

    # Try mock suppliers
    for s in _MOCK_SUPPLIERS:
        if s["id"] == supplier_id:
            return s

    raise HTTPException(404, "Supplier not found")


@router.get("/{supplier_id}/listings")
async def supplier_listings(
    supplier_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = UUID(supplier_id)
        result = await db.scalars(
            select(ProductListing)
            .where(ProductListing.supplier_id == uid)
            .order_by(desc(ProductListing.profit_margin_pct))
        )
        listings = result.all()
        if listings:
            return listings
    except ValueError:
        pass

    # Return mock listings for the given supplier ID
    for s in _MOCK_SUPPLIERS:
        if s["id"] == supplier_id:
            return s.get("listings", [])
    return []
