from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Any
    name: str
    slug: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: Optional[list] = []
    status: Optional[str] = "pending"
    viral_score: Optional[float] = 0.0
    competition_score: Optional[float] = 0.0
    demand_score: Optional[float] = 0.0
    estimated_price_min: Optional[Decimal] = None
    estimated_price_max: Optional[Decimal] = None
    image_urls: Optional[list] = []
    first_detected_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProductListOut(BaseModel):
    total: int
    page: int
    limit: int
    items: list[ProductOut]


class ProductDetailOut(ProductOut):
    source_video_ids: Optional[list] = []
    description: Optional[str] = None


class ProductSearchParams(BaseModel):
    q: Optional[str] = None
    category: Optional[str] = None
    min_viral_score: float = 0.0
    max_price: Optional[float] = None
    sort_by: str = "viral_score"
    page: int = 1
    limit: int = 20
