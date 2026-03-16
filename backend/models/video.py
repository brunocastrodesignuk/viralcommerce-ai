from datetime import datetime, timezone
from sqlalchemy import BigInteger, Column, DateTime, Float, Integer, JSON, String, Text
from backend.models._compat import PK, FK_UUID
from backend.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id               = PK()
    platform         = Column(String(20), nullable=False, index=True)
    external_id      = Column(String(255), nullable=False)
    url              = Column(Text, nullable=False)
    title            = Column(Text)
    caption          = Column(Text)
    hashtags         = Column(JSON, default=list)          # was ARRAY(String)
    views            = Column(BigInteger, default=0)
    likes            = Column(BigInteger, default=0)
    shares           = Column(BigInteger, default=0)
    comments         = Column(BigInteger, default=0)
    author_handle    = Column(String(255))
    author_followers = Column(BigInteger, default=0)
    thumbnail_url    = Column(Text)
    duration_sec     = Column(Integer)
    viral_score      = Column(Float, default=0.0, index=True)
    crawled_at       = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    published_at     = Column(DateTime(timezone=True))
    updated_at       = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Video {self.platform}:{self.external_id} score={self.viral_score}>"


class TrendScore(Base):
    __tablename__ = "trend_scores"

    id          = PK()
    video_id    = FK_UUID("videos.id")
    views       = Column(BigInteger)
    likes       = Column(BigInteger)
    shares      = Column(BigInteger)
    comments    = Column(BigInteger)
    viral_score = Column(Float)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
