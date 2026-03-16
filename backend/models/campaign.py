from datetime import datetime, timezone
from sqlalchemy import BigInteger, Column, DateTime, Float, Integer, JSON, Numeric, String, Text
from backend.models._compat import PK, FK_UUID
from backend.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id                   = PK()
    user_id              = FK_UUID("users.id", nullable=True)
    product_id           = FK_UUID("products.id", nullable=True)
    name                 = Column(Text, nullable=False)
    network              = Column(String(20), nullable=False)
    status               = Column(String(20), default="draft", index=True)
    daily_budget         = Column(Numeric(10, 2))
    total_spend          = Column(Numeric(10, 2), default=0)
    total_revenue        = Column(Numeric(10, 2), default=0)
    roas                 = Column(Numeric(6, 2))
    external_campaign_id = Column(String(255))
    targeting            = Column(JSON, default=dict)          # was JSONB
    started_at           = Column(DateTime(timezone=True))
    ended_at             = Column(DateTime(timezone=True))
    created_at           = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at           = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                                  onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Campaign {self.name} [{self.status}]>"


class Ad(Base):
    __tablename__ = "ads"

    id             = PK()
    campaign_id    = FK_UUID("campaigns.id")
    network        = Column(String(20), nullable=False)
    external_ad_id = Column(String(255))
    headline       = Column(Text)
    body           = Column(Text)
    creative_url   = Column(Text)
    status         = Column(String(20), default="active")
    impressions    = Column(BigInteger, default=0)
    clicks         = Column(BigInteger, default=0)
    conversions    = Column(Integer, default=0)
    spend          = Column(Numeric(10, 2), default=0)
    revenue        = Column(Numeric(10, 2), default=0)
    ctr            = Column(Numeric(6, 4))
    cpc            = Column(Numeric(8, 4))
    roas           = Column(Numeric(6, 2))
    created_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))
