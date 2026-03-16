"""Initial schema — all ViralCommerce tables

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("plan", sa.String(20), server_default="free"),
        sa.Column("api_key", sa.String(128), unique=True, index=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("is_superuser", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── hashtags ─────────────────────────────────────────────────────────────
    op.create_table(
        "hashtags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tag", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("platform", sa.String(20)),
        sa.Column("post_count", sa.BigInteger, server_default="0"),
        sa.Column("trend_velocity", sa.Float, server_default="0.0", index=True),
        sa.Column("is_tracked", sa.Boolean, server_default="false", index=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── videos ───────────────────────────────────────────────────────────────
    op.create_table(
        "videos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("platform", sa.String(20), nullable=False, index=True),
        sa.Column("external_id", sa.String(255), nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("title", sa.Text),
        sa.Column("caption", sa.Text),
        sa.Column("hashtags", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("view_count", sa.BigInteger, server_default="0"),
        sa.Column("like_count", sa.BigInteger, server_default="0"),
        sa.Column("share_count", sa.BigInteger, server_default="0"),
        sa.Column("comment_count", sa.BigInteger, server_default="0"),
        sa.Column("viral_score", sa.Float, server_default="0.0", index=True),
        sa.Column("author_handle", sa.String(255)),
        sa.Column("author_followers", sa.BigInteger),
        sa.Column("thumbnail_url", sa.Text),
        sa.Column("duration_seconds", sa.Integer),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("crawled_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("platform", "external_id", name="uq_video_platform_external_id"),
    )

    # ── trend_scores ──────────────────────────────────────────────────────────
    op.create_table(
        "trend_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("video_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("viral_score", sa.Float, nullable=False),
        sa.Column("views_growth", sa.Float),
        sa.Column("shares_ratio", sa.Float),
        sa.Column("comments_growth", sa.Float),
        sa.Column("like_ratio", sa.Float),
        sa.Column("velocity", sa.Float),
        sa.Column("views_at_record", sa.BigInteger),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), index=True),
    )
    op.create_index("ix_trend_scores_video_id", "trend_scores", ["video_id"])

    # ── products ──────────────────────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("slug", sa.String(500), unique=True, index=True),
        sa.Column("category", sa.String(100), index=True),
        sa.Column("subcategory", sa.String(100)),
        sa.Column("description", sa.Text),
        sa.Column("tags", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("viral_score", sa.Float, server_default="0.0", index=True),
        sa.Column("competition_score", sa.Float, server_default="0.0"),
        sa.Column("demand_score", sa.Float, server_default="0.0"),
        sa.Column("opportunity_score", sa.Float, server_default="0.0"),
        sa.Column("estimated_price_min", sa.Numeric(10, 2)),
        sa.Column("estimated_price_max", sa.Numeric(10, 2)),
        sa.Column("image_urls", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("source_video_ids", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("is_active", sa.Boolean, server_default="true", index=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("first_detected_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── suppliers ─────────────────────────────────────────────────────────────
    op.create_table(
        "suppliers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("platform", sa.String(50), nullable=False, index=True),
        sa.Column("external_id", sa.String(255)),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("store_url", sa.Text),
        sa.Column("rating", sa.Float),
        sa.Column("total_sales", sa.BigInteger),
        sa.Column("ships_to", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("is_verified", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("platform", "external_id", name="uq_supplier_platform_external_id"),
    )

    # ── product_listings ──────────────────────────────────────────────────────
    op.create_table(
        "product_listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_url", sa.Text),
        sa.Column("cost_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("shipping_cost", sa.Numeric(10, 2), server_default="0"),
        sa.Column("moq", sa.Integer, server_default="1"),
        sa.Column("lead_time_days", sa.Integer),
        sa.Column("profit_margin_pct", sa.Float),
        sa.Column("roi_pct", sa.Float),
        sa.Column("in_stock", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_product_listings_product_id", "product_listings", ["product_id"])

    # ── marketing_assets ──────────────────────────────────────────────────────
    op.create_table(
        "marketing_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_type", sa.String(50), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("tone", sa.String(50)),
        sa.Column("language", sa.String(10), server_default="en"),
        sa.Column("generated_by", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── campaigns ─────────────────────────────────────────────────────────────
    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="SET NULL")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("network", sa.String(30), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft", index=True),
        sa.Column("external_campaign_id", sa.String(255)),
        sa.Column("daily_budget", sa.Numeric(10, 2), server_default="50"),
        sa.Column("total_spend", sa.Numeric(12, 2), server_default="0"),
        sa.Column("total_revenue", sa.Numeric(12, 2), server_default="0"),
        sa.Column("roas", sa.Float, server_default="0"),
        sa.Column("targeting", postgresql.JSONB),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── ads ───────────────────────────────────────────────────────────────────
    op.create_table(
        "ads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("external_ad_id", sa.String(255)),
        sa.Column("headline", sa.String(500)),
        sa.Column("body", sa.Text),
        sa.Column("image_url", sa.Text),
        sa.Column("status", sa.String(30), server_default="active"),
        sa.Column("daily_budget", sa.Numeric(10, 2), server_default="5"),
        sa.Column("impressions", sa.BigInteger, server_default="0"),
        sa.Column("clicks", sa.BigInteger, server_default="0"),
        sa.Column("conversions", sa.Integer, server_default="0"),
        sa.Column("spend", sa.Numeric(12, 2), server_default="0"),
        sa.Column("revenue", sa.Numeric(12, 2), server_default="0"),
        sa.Column("ctr", sa.Float, server_default="0"),
        sa.Column("cpc", sa.Float, server_default="0"),
        sa.Column("roas", sa.Float, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_ads_campaign_id", "ads", ["campaign_id"])

    # ── crawler_jobs ──────────────────────────────────────────────────────────
    op.create_table(
        "crawler_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("platform", sa.String(30), nullable=False, index=True),
        sa.Column("job_type", sa.String(50), nullable=False),
        sa.Column("target", sa.String(255)),
        sa.Column("status", sa.String(20), server_default="pending", index=True),
        sa.Column("videos_found", sa.Integer),
        sa.Column("error_msg", sa.Text),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), index=True),
    )


def downgrade() -> None:
    op.drop_table("crawler_jobs")
    op.drop_table("ads")
    op.drop_table("campaigns")
    op.drop_table("marketing_assets")
    op.drop_table("product_listings")
    op.drop_table("suppliers")
    op.drop_table("products")
    op.drop_table("trend_scores")
    op.drop_table("videos")
    op.drop_table("hashtags")
    op.drop_table("users")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
    op.execute("DROP EXTENSION IF EXISTS vector")
