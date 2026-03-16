"""
Billing API — Stripe subscription management
"""
import os
import stripe
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
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": body.price_id, "quantity": 1}],
            customer_email=current_user.email,
            client_reference_id=str(current_user.id),
            success_url=body.success_url + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=body.cancel_url,
            metadata={"user_id": str(current_user.id)},
            subscription_data={
                "trial_period_days": 7,
                "metadata": {"user_id": str(current_user.id)},
            },
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
