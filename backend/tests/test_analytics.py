"""
Tests for /api/v1/analytics — overview, platform stats, viral timeline,
category breakdown, and ad performance.
"""
import pytest


@pytest.mark.asyncio
class TestAnalyticsOverview:
    async def test_overview_returns_200(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/overview", headers=auth_headers)
        assert resp.status_code == 200

    async def test_overview_has_required_fields(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/overview", headers=auth_headers)
        data = resp.json()
        required = [
            "viral_products_24h",
            "videos_crawled_today",
            "top_platform",
        ]
        for field in required:
            assert field in data, f"Missing field: {field}"

    async def test_overview_unauthenticated(self, client):
        resp = await client.get("/api/v1/analytics/overview")
        assert resp.status_code == 401

    async def test_overview_numeric_fields_non_negative(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/overview", headers=auth_headers)
        data = resp.json()
        for key in ["viral_products_24h", "videos_crawled_today"]:
            assert data[key] >= 0, f"{key} must be >= 0"


@pytest.mark.asyncio
class TestPlatformStats:
    async def test_platform_stats_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/platform-stats", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_platform_stats_custom_hours(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/analytics/platform-stats",
            headers=auth_headers,
            params={"hours": 48},
        )
        assert resp.status_code == 200

    async def test_platform_stats_invalid_hours(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/analytics/platform-stats",
            headers=auth_headers,
            params={"hours": -1},
        )
        assert resp.status_code == 422

    async def test_platform_stats_has_platform_field(self, client, auth_headers, db_session):
        # Seed a video so there's data
        from backend.models.video import Video
        import uuid
        from datetime import datetime, timezone
        v = Video(
            platform="tiktok",
            external_id=f"test_{uuid.uuid4().hex[:8]}",
            url="https://tiktok.com/test",
            viral_score=80.0,
            view_count=1_000_000,
        )
        db_session.add(v)
        await db_session.commit()

        resp = await client.get("/api/v1/analytics/platform-stats", headers=auth_headers)
        assert resp.status_code == 200
        for item in resp.json():
            assert "platform" in item


@pytest.mark.asyncio
class TestViralTimeline:
    async def test_viral_timeline_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/viral-timeline", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_viral_timeline_hours_param(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/analytics/viral-timeline",
            headers=auth_headers,
            params={"hours": 168},  # 7 days
        )
        assert resp.status_code == 200

    async def test_viral_timeline_data_shape(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/viral-timeline", headers=auth_headers)
        items = resp.json()
        for item in items:
            assert "date" in item or "hour" in item or "timestamp" in item


@pytest.mark.asyncio
class TestCategoryBreakdown:
    async def test_category_breakdown_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v1/analytics/category-breakdown", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_category_breakdown_has_count(self, client, auth_headers, seed_product):
        resp = await client.get("/api/v1/analytics/category-breakdown", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.json()
        for item in items:
            assert "category" in item
            assert "count" in item
            assert item["count"] >= 0


@pytest.mark.asyncio
class TestTrendRadar:
    async def test_radar_report_returns_200(self, client, auth_headers):
        resp = await client.get("/api/v1/radar/report", headers=auth_headers)
        assert resp.status_code == 200

    async def test_radar_report_structure(self, client, auth_headers):
        resp = await client.get("/api/v1/radar/report", headers=auth_headers)
        data = resp.json()
        assert "top_trending" in data
        assert "emerging_trends" in data
        assert "clusters" in data
        assert "generated_at" in data

    async def test_radar_emerging_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v1/radar/emerging", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_radar_clusters_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v1/radar/clusters", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_radar_platform_filter(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/radar/report",
            headers=auth_headers,
            params={"platform": "tiktok"},
        )
        assert resp.status_code == 200
