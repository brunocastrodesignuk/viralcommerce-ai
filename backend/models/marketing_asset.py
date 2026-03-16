from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String, Text
from backend.models._compat import PK, FK_UUID
from backend.core.database import Base


class MarketingAsset(Base):
    __tablename__ = "marketing_assets"

    id           = PK()
    product_id   = FK_UUID("products.id", nullable=True)
    user_id      = FK_UUID("users.id", nullable=True)
    asset_type   = Column(String(30), nullable=False)
    platform     = Column(String(20))
    content      = Column(Text, nullable=False)
    tone         = Column(String(30), default="engaging")
    language     = Column(String(5), default="en")
    generated_by = Column(String(50), default="claude-sonnet-4-6")
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
