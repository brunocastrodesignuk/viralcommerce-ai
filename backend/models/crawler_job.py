from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String, Text
from backend.models._compat import PK, FK_UUID
from backend.core.database import Base


class CrawlerJob(Base):
    __tablename__ = "crawler_jobs"

    id           = PK()
    platform     = Column(String(20), nullable=False, index=True)
    job_type     = Column(String(30), nullable=False)
    target       = Column(String(255))
    status       = Column(String(20), default="queued", index=True)
    videos_found = Column(Integer, default=0)
    error_msg    = Column(Text)
    started_at   = Column(DateTime(timezone=True))
    finished_at  = Column(DateTime(timezone=True))
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
