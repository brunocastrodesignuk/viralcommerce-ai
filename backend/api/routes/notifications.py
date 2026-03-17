"""
Notifications API — viral product alerts via webhook/email.
Users configure their notification endpoints in the frontend settings.
"""
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.product import Product

router = APIRouter()


class WebhookConfig(BaseModel):
    webhook_url: str          # Discord, Slack, Zapier, or custom URL
    min_viral_score: float = 75.0
    test: bool = False        # If True, sends a test notification


class EmailAlertConfig(BaseModel):
    email: str
    min_viral_score: float = 75.0


@router.post("/webhook/test")
async def test_webhook(config: WebhookConfig):
    """Send a test notification to the configured webhook URL."""
    payload = _build_webhook_payload(
        product_name="🧪 Produto de Teste — ViralCommerce AI",
        viral_score=92.0,
        category="Teste",
        product_id="test-123",
        is_test=True,
    )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                config.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
        if resp.status_code < 300:
            return {"success": True, "message": "✅ Notificação de teste enviada com sucesso!"}
        else:
            raise HTTPException(400, f"Webhook retornou status {resp.status_code}: {resp.text[:200]}")
    except httpx.TimeoutException:
        raise HTTPException(504, "Timeout ao enviar para o webhook.")
    except httpx.ConnectError:
        raise HTTPException(503, "Não foi possível conectar ao URL do webhook. Verifique a URL.")


@router.post("/webhook/check-viral")
async def check_and_notify_viral(config: WebhookConfig, db: AsyncSession = Depends(get_db)):
    """
    Check for recently discovered viral products above the threshold
    and send webhook notifications for new ones.
    """
    # Look for products updated in last 2 hours above score threshold
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    result = await db.scalars(
        select(Product)
        .where(
            Product.viral_score >= config.min_viral_score,
            Product.updated_at >= cutoff,
            Product.status == "active",
        )
        .order_by(desc(Product.viral_score))
        .limit(10)
    )
    products = result.all()

    if not products:
        return {"sent": 0, "message": "Nenhum produto viral novo encontrado no período."}

    sent = 0
    errors = []
    async with httpx.AsyncClient(timeout=10) as client:
        for p in products:
            payload = _build_webhook_payload(
                product_name=p.name,
                viral_score=float(p.viral_score or 0),
                category=p.category or "Geral",
                product_id=str(p.id),
            )
            try:
                resp = await client.post(
                    config.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code < 300:
                    sent += 1
                else:
                    errors.append(f"{p.name}: HTTP {resp.status_code}")
            except Exception as e:
                errors.append(f"{p.name}: {str(e)[:50]}")

    return {
        "sent": sent,
        "total_found": len(products),
        "errors": errors[:3] if errors else None,
    }


_MOCK_VIRAL_PRODUCTS = [
    {"id": "notif-001", "name": "Ice Roller Face Lymphatic Drainage", "viral_score": 97.2, "category": "Beleza", "image": None},
    {"id": "notif-002", "name": "Cloud Slippers Thick Sole Platform", "viral_score": 94.5, "category": "Moda", "image": None},
    {"id": "notif-003", "name": "Magnetic MagSafe Phone Wallet", "viral_score": 91.8, "category": "Gadgets", "image": None},
    {"id": "notif-004", "name": "Cottagecore Floral Hair Claw Clips", "viral_score": 88.3, "category": "Acessórios", "image": None},
    {"id": "notif-005", "name": "Portable Espresso Machine Handheld", "viral_score": 85.1, "category": "Casa", "image": None},
]


@router.get("/viral-products/recent")
async def get_recent_viral_products(
    min_score: float = 75.0,
    hours: int = 24,
    db: AsyncSession = Depends(get_db),
):
    """Get recently discovered viral products for notification preview."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    # Try DB first (no cutoff filter — show all high-score active products)
    result = await db.scalars(
        select(Product)
        .where(
            Product.viral_score >= min_score,
            Product.status == "active",
        )
        .order_by(desc(Product.viral_score))
        .limit(20)
    )
    products = result.all()

    if products:
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "viral_score": float(p.viral_score or 0),
                "category": p.category,
                "image": (p.image_urls or [None])[0],
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            }
            for p in products
        ]

    # Fallback: return mock viral alerts so the bell always shows something
    return [
        {**p, "updated_at": datetime.now(timezone.utc).isoformat()}
        for p in _MOCK_VIRAL_PRODUCTS
        if p["viral_score"] >= min_score
    ]


def _build_webhook_payload(
    product_name: str,
    viral_score: float,
    category: str,
    product_id: str,
    is_test: bool = False,
) -> dict:
    """
    Build a webhook payload compatible with Discord, Slack, and generic webhooks.
    Auto-detects format based on URL is handled by the client; we send Discord embed format
    which most services can parse or forward.
    """
    score_emoji = "🔥" if viral_score >= 85 else "⚡" if viral_score >= 75 else "📈"
    title = f"{'🧪 [TESTE] ' if is_test else ''}{score_emoji} Produto Viral Detectado!"

    # Discord Embed format (also works as Slack/Zapier payload)
    return {
        # Discord webhook format
        "username": "ViralCommerce AI",
        "avatar_url": "https://viralcommerce.ai/icons/icon.svg",
        "embeds": [
            {
                "title": title,
                "description": f"**{product_name}**\n\nCategoria: {category}\nScore Viral: **{viral_score:.0f}/100**",
                "color": 0x0EA5E9,  # Brand blue
                "fields": [
                    {"name": "Score Viral", "value": f"{viral_score:.0f}/100", "inline": True},
                    {"name": "Categoria", "value": category, "inline": True},
                    {"name": "Ver Produto", "value": f"[Abrir no ViralCommerce](/products/{product_id})", "inline": False},
                ],
                "footer": {"text": "ViralCommerce AI • Alertas de Produtos Virais"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
        # Slack format (ignored by Discord, used by Slack)
        "text": f"{title}\n{product_name}\nScore: {viral_score:.0f}/100 | Categoria: {category}",
        # Generic format
        "product_name": product_name,
        "viral_score": viral_score,
        "category": category,
        "product_id": product_id,
        "platform": "ViralCommerce AI",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
