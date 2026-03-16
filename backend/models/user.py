from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, String, Text
from backend.models._compat import PK
from backend.core.database import Base
import secrets


class User(Base):
    __tablename__ = "users"

    id              = PK()
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(Text)
    full_name       = Column(String(255))
    plan            = Column(String(20), default="free")
    api_key         = Column(String(64), unique=True, default=lambda: secrets.token_hex(32))
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<User {self.email} [{self.plan}]>"
