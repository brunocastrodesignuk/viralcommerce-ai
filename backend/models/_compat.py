"""
Cross-database compatible column helpers.

PostgreSQL → UUID nativo, ARRAY nativo, JSONB nativo
SQLite     → String(36) para UUID, JSON para ARRAY/JSONB
"""
import os
import uuid as _uuid
from sqlalchemy import Column, String, JSON, ForeignKey

_IS_SQLITE = "sqlite" in os.getenv("DATABASE_URL", "sqlite").lower()


def _uuid_type():
    if _IS_SQLITE:
        return String(36)
    from sqlalchemy.dialects.postgresql import UUID
    return UUID(as_uuid=True)


def _uuid_default():
    if _IS_SQLITE:
        return lambda: str(_uuid.uuid4())
    return _uuid.uuid4


def PK():
    """Primary key UUID column."""
    return Column(_uuid_type(), primary_key=True, default=_uuid_default())


def FK_UUID(target: str, nullable=False, index=True):
    """Foreign key UUID column."""
    return Column(_uuid_type(), ForeignKey(target, ondelete="CASCADE"),
                  nullable=nullable, index=index)


def UUIDCol(nullable=True, index=False):
    """Plain UUID column (no FK)."""
    return Column(_uuid_type(), nullable=nullable, index=index)
