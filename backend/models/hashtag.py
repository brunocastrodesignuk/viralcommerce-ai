from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, BigInteger, String
from backend.models._compat import PK
from backend.core.database import Base


class Hashtag(Base):
    __tablename__ = "hashtags"

    id             = PK()
    tag            = Column(String(255), unique=True, nullable=False, index=True)
    platform       = Column(String(20))
    post_count     = Column(BigInteger, default=0)
    trend_velocity = Column(Float, default=0.0, index=True)
    is_tracked     = Column(Boolean, default=False, index=True)
    first_seen_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
