"""
ViralCommerce AI — Email Service
Handles SMTP email sending for viral alerts and notifications.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.models.product import Product
from backend.models.user import User

log = structlog.get_logger()


async def send_viral_alert_emails(
    db: AsyncSession,
    min_score: float = 95.0,
    notified_ids: set | None = None,
) -> Tuple[int, list]:
    """Find viral products and email Pro/Enterprise subscribers. Returns (sent, errors)."""
    if notified_ids is None:
        notified_ids = set()

    # Find products above threshold not yet notified this session
    result = await db.scalars(
        select(Product)
        .where(Product.viral_score >= min_score, Product.status == "active")
        .limit(5)
    )
    hot_products = [p for p in result.all() if str(p.id) not in notified_ids]

    if not hot_products:
        return 0, []

    # Get Pro/Enterprise subscribers
    sub_result = await db.scalars(
        select(User).where(
            User.plan.in_(["pro", "enterprise"]),
            User.is_active == True,
        )
    )
    users = sub_result.all()

    if not users:
        return 0, []

    if not settings.SMTP_HOST:
        log.warning("Viral alert skipped — SMTP not configured")
        return 0, ["SMTP not configured"]

    sent = 0
    errors = []
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
            for product in hot_products:
                html = _build_viral_email(product)
                for user in users:
                    try:
                        msg = MIMEMultipart("alternative")
                        msg["Subject"] = f"🔥 Produto Viral Detectado: {product.name[:50]}"
                        msg["From"] = f"ViralCommerce AI <{settings.SMTP_FROM}>"
                        msg["To"] = user.email
                        msg.attach(MIMEText(html, "html", "utf-8"))
                        smtp.sendmail(settings.SMTP_FROM, user.email, msg.as_string())
                        sent += 1
                    except Exception as e:
                        errors.append(f"{user.email}: {str(e)[:50]}")
                notified_ids.add(str(product.id))
                log.info("Viral alert sent", product=product.name, users=len(users))
    except Exception as e:
        errors.append(f"SMTP error: {str(e)[:100]}")
        log.error("Viral alert SMTP error", error=str(e)[:200])

    return sent, errors


def _build_viral_email(product: Product) -> str:
    """Build beautiful HTML email for a viral product alert."""
    score = int(product.viral_score or 0)
    score_emoji = "🔥" if score >= 95 else "⚡" if score >= 85 else "📈"
    img_url = (product.image_urls or [None])[0] or ""
    img_html = f'<img src="{img_url}" style="width:100%;max-width:400px;border-radius:12px;margin:16px auto;display:block;" />' if img_url else ""

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Produto Viral Detectado</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="background:#0ea5e9;display:inline-block;padding:8px 20px;border-radius:100px;color:white;font-size:13px;font-weight:bold;letter-spacing:1px;">
        ⚡ VIRALCOMMERCE AI
      </div>
    </div>

    <!-- Card -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">{score_emoji}</div>
      <h1 style="color:white;font-size:22px;margin:0 0 8px;">Produto Viral Detectado!</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
        Este produto acabou de atingir <strong style="color:#0ea5e9;">{score}/100</strong> no Score Viral
      </p>

      {img_html}

      <h2 style="color:white;font-size:18px;margin:16px 0 8px;">{product.name}</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 24px;">Categoria: {product.category or "Geral"}</p>

      <!-- Score Bar -->
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:24px;text-align:left;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#94a3b8;font-size:13px;">Score Viral</span>
          <span style="color:#0ea5e9;font-weight:bold;">{score}/100</span>
        </div>
        <div style="background:#334155;border-radius:4px;height:8px;">
          <div style="background:linear-gradient(90deg,#0ea5e9,#a855f7);width:{score}%;height:8px;border-radius:4px;"></div>
        </div>
      </div>

      <!-- CTA -->
      <a href="https://app.viralcommerce.ai/products"
         style="display:inline-block;background:#0ea5e9;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">
        Ver Produto no ViralCommerce →
      </a>

      <p style="color:#475569;font-size:12px;margin-top:24px;">
        Você recebe este alerta pois é assinante do plano Pro/Enterprise.<br>
        <a href="https://app.viralcommerce.ai/settings" style="color:#0ea5e9;">Gerenciar notificações</a>
      </p>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#334155;font-size:12px;margin-top:16px;">
      ViralCommerce AI • Inteligência de produto viral em tempo real
    </p>
  </div>
</body>
</html>
"""
