"""
ViralCommerce AI — Admin Panel API
Protected routes for system administration.
Admin key must match ADMIN_SECRET_KEY in environment (X-Admin-Key header).
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.config import settings
from backend.models.user import User
from backend.models.product import Product

router = APIRouter()


def require_admin(x_admin_key: str = Header(...)):
    """Simple header-based admin auth."""
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(403, "Invalid admin key")
    return x_admin_key


# ─── Stats ───────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    total_users = await db.scalar(select(func.count(User.id)))
    by_plan_rows = await db.execute(
        select(User.plan, func.count(User.id)).group_by(User.plan)
    )
    total_products = await db.scalar(select(func.count(Product.id)))
    viral_products = await db.scalar(
        select(func.count(Product.id)).where(Product.viral_score >= 85)
    )
    new_users_7d = await db.scalar(
        select(func.count(User.id)).where(
            User.created_at >= datetime.now(timezone.utc) - timedelta(days=7)
        )
    )
    return {
        "total_users": total_users or 0,
        "users_by_plan": dict(by_plan_rows.all()),
        "total_products": total_products or 0,
        "viral_products": viral_products or 0,
        "new_users_7d": new_users_7d or 0,
    }


# ─── Users ───────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    plan: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    q = select(User).order_by(desc(User.created_at)).offset(offset).limit(limit)
    if plan:
        q = q.where(User.plan == plan)
    result = await db.scalars(q)
    users = result.all()

    count_q = select(func.count(User.id))
    if plan:
        count_q = count_q.where(User.plan == plan)
    total = await db.scalar(count_q)

    return {
        "total": total or 0,
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name or "",
                "plan": u.plan,
                "is_active": u.is_active,
                "stripe_customer_id": u.stripe_customer_id,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "updated_at": u.updated_at.isoformat() if u.updated_at else None,
            }
            for u in users
        ],
    }


@router.patch("/users/{user_id}/plan")
async def update_user_plan(
    user_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    new_plan = body.get("plan")
    if new_plan not in ("free", "pro", "enterprise"):
        raise HTTPException(400, "Invalid plan. Use: free, pro, enterprise")
    user.plan = new_plan
    await db.commit()
    return {"success": True, "email": user.email, "plan": user.plan}


@router.patch("/users/{user_id}/active")
async def toggle_user_active(
    user_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = bool(body.get("is_active", True))
    await db.commit()
    return {"success": True, "email": user.email, "is_active": user.is_active}


# ─── Email Blast ─────────────────────────────────────────────

class EmailBlastRequest(BaseModel):
    subject: str
    body_html: str
    plan_filter: Optional[str] = None   # "pro", "enterprise", "free", None = all
    preview_only: bool = False          # True = just return recipient count/preview


@router.post("/send-email-blast")
async def send_email_blast(
    req: EmailBlastRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    """Send a promotional email to all users (or filter by plan)."""
    q = select(User).where(User.is_active == True)
    if req.plan_filter:
        q = q.where(User.plan == req.plan_filter)
    result = await db.scalars(q)
    users = result.all()

    if req.preview_only:
        return {
            "recipients": len(users),
            "preview_emails": [u.email for u in users[:5]],
        }

    if not settings.SMTP_HOST:
        raise HTTPException(
            503,
            "SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM to .env"
        )

    sent = 0
    errors = []
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
            for user in users:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = req.subject
                    msg["From"] = f"ViralCommerce AI <{settings.SMTP_FROM}>"
                    msg["To"] = user.email
                    msg.attach(MIMEText(req.body_html, "html", "utf-8"))
                    smtp.sendmail(settings.SMTP_FROM, user.email, msg.as_string())
                    sent += 1
                except Exception as e:
                    errors.append(f"{user.email}: {str(e)[:60]}")
    except Exception as e:
        raise HTTPException(503, f"SMTP connection failed: {str(e)[:120]}")

    return {
        "sent": sent,
        "total": len(users),
        "errors": errors[:5] if errors else None,
    }


# ─── Viral Alert (manual trigger) ────────────────────────────

@router.post("/trigger-viral-alerts")
async def trigger_viral_alerts(
    min_score: float = 95.0,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    """Manually trigger viral product email alerts to Pro/Enterprise subscribers."""
    from backend.services.email import send_viral_alert_emails
    sent, errors = await send_viral_alert_emails(db, min_score=min_score)
    return {"sent": sent, "errors": errors}
