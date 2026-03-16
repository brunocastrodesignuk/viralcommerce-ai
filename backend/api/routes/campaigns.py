"""
Campaigns API — ad campaign creation, management, and optimization
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.campaign import Campaign, Ad
from backend.services.campaigns.optimizer import CampaignOptimizer
from backend.api.schemas.campaign import CampaignCreate, CampaignOut, AdOut

router = APIRouter()


@router.get("/", response_model=list[CampaignOut])
async def list_campaigns(
    status: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Campaign)
    if status:
        query = query.where(Campaign.status == status)
    result = await db.scalars(query.order_by(desc(Campaign.created_at)))
    return result.all()


@router.post("/", response_model=CampaignOut, status_code=201)
async def create_campaign(
    payload: CampaignCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new ad campaign. Auto-generates 10 ad variations at $5 each."""
    optimizer = CampaignOptimizer()
    campaign = await optimizer.create_campaign(payload=payload, db=db)
    return campaign


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    return campaign


@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    """Push campaign to ad network and start spending."""
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    optimizer = CampaignOptimizer()
    result = await optimizer.launch(campaign=campaign, db=db)
    return result


@router.post("/{campaign_id}/optimize")
async def optimize_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Kill losing ads (ROAS < threshold), scale winners.
    Called by scheduler every 6h automatically.
    """
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    optimizer = CampaignOptimizer()
    report = await optimizer.optimize(campaign=campaign, db=db)
    return report


@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    optimizer = CampaignOptimizer()
    await optimizer.pause(campaign=campaign, db=db)
    return {"status": "paused"}


@router.get("/{campaign_id}/ads", response_model=list[AdOut])
async def list_ads(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(Ad)
        .where(Ad.campaign_id == campaign_id)
        .order_by(desc(Ad.roas))
    )
    return result.all()


@router.get("/{campaign_id}/performance")
async def campaign_performance(campaign_id: UUID):
    """
    Fetch aggregated performance data for a campaign.
    Returns demo data — ad network event tracking not yet implemented.
    """
    import random
    rng = random.Random(str(campaign_id))
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    return [
        {
            "hour": (now - timedelta(hours=i)).isoformat(),
            "impressions": rng.randint(800, 8000),
            "clicks": rng.randint(30, 400),
            "conversions": rng.randint(1, 25),
            "spend": round(rng.uniform(10, 200), 2),
            "revenue": round(rng.uniform(40, 900), 2),
            "avg_roas": round(rng.uniform(2.5, 6.0), 2),
            "note": "demo_data",
        }
        for i in range(24, 0, -1)
    ]
