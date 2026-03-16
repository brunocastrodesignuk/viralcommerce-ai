from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, Numeric, String, Text
from backend.models._compat import PK, FK_UUID
from backend.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id                  = PK()
    name                = Column(Text, nullable=False)
    slug                = Column(String(255), unique=True, index=True)
    category            = Column(String(100), index=True)
    subcategory         = Column(String(100))
    description         = Column(Text)
    tags                = Column(JSON, default=list)          # was ARRAY(String)
    status              = Column(String(20), default="pending", index=True)
    viral_score         = Column(Float, default=0.0, index=True)
    competition_score   = Column(Float, default=0.0)
    demand_score        = Column(Float, default=0.0)
    estimated_price_min = Column(Numeric(10, 2))
    estimated_price_max = Column(Numeric(10, 2))
    image_urls          = Column(JSON, default=list)          # was ARRAY(String)
    source_video_ids    = Column(JSON, default=list)          # was ARRAY(UUID)
    first_detected_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at          = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                                 onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Product {self.name} score={self.viral_score}>"


class ProductListing(Base):
    __tablename__ = "product_listings"

    id                   = PK()
    product_id           = FK_UUID("products.id")
    supplier_id          = FK_UUID("suppliers.id")
    supplier_url         = Column(Text)
    supplier_sku         = Column(String(255))
    cost_price           = Column(Numeric(10, 2), nullable=False)
    shipping_cost        = Column(Numeric(10, 2), default=0)
    shipping_days_min    = Column(Integer)
    shipping_days_max    = Column(Integer)
    moq                  = Column(Integer, default=1)
    currency             = Column(String(3), default="USD")
    in_stock             = Column(Boolean, default=True)
    sale_price_suggested = Column(Numeric(10, 2))
    profit_margin_pct    = Column(Numeric(5, 2), index=True)
    roi_pct              = Column(Numeric(6, 2))
    last_checked_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at           = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
