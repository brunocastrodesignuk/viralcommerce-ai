"""
Cross-database compatible column types.

PostgreSQL → uses native ARRAY, JSONB, UUID
SQLite     → uses JSON (for arrays/dicts) and String (for UUIDs)
"""
import json
import os
from typing import Any

from sqlalchemy import String, Text, JSON
from sqlalchemy.dialects import postgresql
from sqlalchemy.types import TypeDecorator, UserDefinedType

# Detect which DB we're using from DATABASE_URL
_DB_URL = os.getenv("DATABASE_URL", "sqlite")
_IS_SQLITE = "sqlite" in _DB_URL.lower()


def UUIDType():
    """UUID column — native on PostgreSQL, String(36) on SQLite."""
    if _IS_SQLITE:
        return String(36)
    return postgresql.UUID(as_uuid=True)


def ArrayType(item_type=Text):
    """Array column — native ARRAY on PostgreSQL, JSON on SQLite."""
    if _IS_SQLITE:
        return JSON
    return postgresql.ARRAY(item_type)


def JSONBType():
    """JSONB column — native on PostgreSQL, JSON on SQLite."""
    if _IS_SQLITE:
        return JSON
    return postgresql.JSONB
