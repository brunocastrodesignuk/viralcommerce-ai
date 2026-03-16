from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class CampaignCreate(BaseModel):
    name: str
    network: str
    product_id: Optional[Any] = None
    daily_budget: Optional[Decimal] = None
    targeting: Optional[dict] = {}


class AdOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    campaign_id: Any
    network: str
    external_ad_id: Optional[str] = None
    headline: Optional[str] = None
    body: Optional[str] = None
    creative_url: Optional[str] = None
    status: Optional[str] = "active"
    impressions: Optional[int] = 0
    clicks: Optional[int] = 0
    conversions: Optional[int] = 0
    spend: Optional[Decimal] = None
    revenue: Optional[Decimal] = None
    ctr: Optional[Decimal] = None
    cpc: Optional[Decimal] = None
    roas: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    user_id: Optional[Any] = None
    product_id: Optional[Any] = None
    name: str
    network: str
    status: Optional[str] = "draft"
    daily_budget: Optional[Decimal] = None
    total_spend: Optional[Decimal] = None
    total_revenue: Optional[Decimal] = None
    roas: Optional[Decimal] = None
    external_campaign_id: Optional[str] = None
    targeting: Optional[dict] = {}
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
