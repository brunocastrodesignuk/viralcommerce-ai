"""
Billing API — Stripe subscription management
"""
import os
import stripe
import httpx
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.core.database import get_db
from backend.api.routes.auth import get_current_user
from backend.models.user import User

router = APIRouter()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")


class CheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


class PortalRequest(BaseModel):
    return_url: str


class MercadoPagoRequest(BaseModel):
    plan_id: str          # "pro" or "enterprise"
    plan_name: str        # "Pro" or "Empresarial"
    price: float          # 47.0 or 197.0
    success_url: str
    cancel_url: str

class MPWebhookPayload(BaseModel):
    type: str
    data: dict


@router.post("/create-checkout-session")
async def create_checkout_session(
    body: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for subscription."""
    if not stripe.api_key:
        raise HTTPException(
            status_code=503,
            detail="Payment service not configured. Contact support."
        )

    try:
        session = stripe.checkout.Session.create(
            # automatic_payment_methods enables: card, Apple Pay, Google Pay,
            # Link (Stripe's 1-click checkout), Klarna, Afterpay, PayPal (where available)
            automatic_payment_methods={"enabled": True},
            mode="subscription",
            line_items=[{"price": body.price_id, "quantity": 1}],
            customer_email=current_user.email,
            client_reference_id=str(current_user.id),
            success_url=body.success_url + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=body.cancel_url,
            allow_promotion_codes=True,
            billing_address_collection="auto",
            metadata={"user_id": str(current_user.id)},
            subscription_data={
                "trial_period_days": 10,   # 10-day free trial
                "metadata": {"user_id": str(current_user.id)},
            },
            # Locale: auto-detect based on user's browser
            locale="auto",
        )
        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.error.InvalidRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/customer-portal")
async def customer_portal(
    body: PortalRequest,
    current_user: User = Depends(get_current_user),
):
    """Create Stripe customer portal session for subscription management."""
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payment service not configured.")

    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")

    try:
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=body.return_url,
        )
        return {"portal_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhook events for subscription lifecycle."""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    payload = await request.body()

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, webhook_secret
            )
        else:
            event = stripe.Event.construct_from(
                await request.json(), stripe.api_key
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        customer_id = data.get("customer")
        if user_id:
            from sqlalchemy import update
            from backend.models.user import User as UserModel
            import uuid
            await db.execute(
                update(UserModel)
                .where(UserModel.id == uuid.UUID(user_id))
                .values(plan="pro", stripe_customer_id=customer_id)
            )
            await db.commit()

    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        customer_id = data.get("customer")
        if customer_id:
            from sqlalchemy import update, select
            from backend.models.user import User as UserModel
            await db.execute(
                update(UserModel)
                .where(UserModel.stripe_customer_id == customer_id)
                .values(plan="free")
            )
            await db.commit()

    elif event_type == "customer.subscription.updated":
        customer_id = data.get("customer")
        status = data.get("status")
        if customer_id and status == "active":
            from sqlalchemy import update
            from backend.models.user import User as UserModel
            await db.execute(
                update(UserModel)
                .where(UserModel.stripe_customer_id == customer_id)
                .values(plan="pro")
            )
            await db.commit()

    return {"received": True}


@router.get("/subscription-status")
async def subscription_status(
    current_user: User = Depends(get_current_user),
):
    """Get current user's subscription status."""
    return {
        "plan": current_user.plan,
        "stripe_customer_id": current_user.stripe_customer_id,
        "is_subscribed": current_user.plan in ("pro", "enterprise"),
    }


@router.post("/create-mp-preference")
async def create_mp_preference(
    body: MercadoPagoRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Mercado Pago checkout preference for plan subscription."""
    mp_token = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
    if not mp_token:
        raise HTTPException(
            status_code=503,
            detail="Pagamentos via Mercado Pago não configurados. Entre em contato com o suporte."
        )

    preference_data = {
        "items": [
            {
                "id": body.plan_id,
                "title": f"ViralCommerce AI — Plano {body.plan_name}",
                "description": f"Assinatura mensal do Plano {body.plan_name}",
                "quantity": 1,
                "unit_price": body.price,
                "currency_id": "BRL",
            }
        ],
        "payer": {
            "email": current_user.email,
        },
        "back_urls": {
            "success": body.success_url,
            "failure": body.cancel_url,
            "pending": body.success_url + "&status=pending",
        },
        "auto_return": "approved",
        "external_reference": str(current_user.id),
        "statement_descriptor": "VIRALCOMMERCE",
        "metadata": {
            "user_id": str(current_user.id),
            "plan": body.plan_id,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.mercadopago.com/checkout/preferences",
                headers={
                    "Authorization": f"Bearer {mp_token}",
                    "Content-Type": "application/json",
                },
                json=preference_data,
            )
            response.raise_for_status()
            data = response.json()

        # Return sandbox URL in test mode, production URL in prod
        is_sandbox = mp_token.startswith("TEST-")
        checkout_url = data.get("sandbox_init_point" if is_sandbox else "init_point", data.get("init_point"))

        return {
            "checkout_url": checkout_url,
            "preference_id": data.get("id"),
            "provider": "mercadopago",
        }
    except httpx.HTTPStatusError as e:
        detail = f"Mercado Pago error: {e.response.text[:200]}"
        raise HTTPException(status_code=502, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Falha ao criar preferência de pagamento")


@router.post("/mp-webhook")
async def mercadopago_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle Mercado Pago IPN/webhook notifications."""
    try:
        payload = await request.json()
    except Exception:
        return {"received": True}

    mp_token = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
    notification_type = payload.get("type", "")

    # Handle payment approval
    if notification_type == "payment":
        payment_id = payload.get("data", {}).get("id")
        if payment_id and mp_token:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"https://api.mercadopago.com/v1/payments/{payment_id}",
                        headers={"Authorization": f"Bearer {mp_token}"},
                    )
                    payment = resp.json()

                if payment.get("status") == "approved":
                    user_id = payment.get("metadata", {}).get("user_id") or payment.get("external_reference")
                    plan = payment.get("metadata", {}).get("plan", "pro")
                    if user_id:
                        from sqlalchemy import update
                        from backend.models.user import User as UserModel
                        import uuid as _uuid
                        try:
                            await db.execute(
                                update(UserModel)
                                .where(UserModel.id == _uuid.UUID(user_id))
                                .values(plan=plan)
                            )
                            await db.commit()
                        except Exception:
                            pass
            except Exception:
                pass

    return {"received": True}


@router.get("/payment-config")
async def payment_config():
    """Return which payment providers are configured (for frontend detection)."""
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
    mp_token = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
    stripe_configured = bool(stripe_key)
    mp_configured = bool(mp_token)
    whatsapp = os.getenv("SUPPORT_WHATSAPP", "")

    # When Stripe is configured, automatic_payment_methods enables all of these
    stripe_methods = (
        ["card", "apple_pay", "google_pay", "link", "paypal", "klarna", "afterpay_clearpay"]
        if stripe_configured
        else []
    )
    # Mercado Pago methods (Brazil)
    mp_methods = (
        ["pix", "boleto", "credit_card", "debit_card"]
        if mp_configured
        else []
    )

    return {
        "stripe": stripe_configured,
        "mercadopago": mp_configured,
        "any_configured": stripe_configured or mp_configured,
        "whatsapp": whatsapp,
        "stripe_methods": stripe_methods,
        "mp_methods": mp_methods,
        "all_methods": stripe_methods + mp_methods,
    }
