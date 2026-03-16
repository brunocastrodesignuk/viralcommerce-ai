from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, Numeric, String, Text
from backend.models._compat import PK
from backend.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id              = PK()
    platform        = Column(String(30), nullable=False, index=True)
    external_id     = Column(String(255))
    name            = Column(Text, nullable=False)
    url             = Column(Text)
    rating          = Column(Numeric(3, 2))
    total_orders    = Column(Integer, default=0)
    response_time_h = Column(Integer)
    ships_from      = Column(String(100))
    ships_to        = Column(JSON, default=list)          # was ARRAY(String)
    is_verified     = Column(Boolean, default=False)
    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Supplier {self.name} ({self.platform})>"
