"""
Tests for /api/v1/crawler — jobs list, start job, stats, hashtag scan.
"""
import pytest
import uuid


@pytest.mark.asyncio
class TestCrawlerStats:
    async def test_stats_returns_200(self, client, auth_headers):
        resp = await client.get("/api/v1/crawler/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_jobs" in data
        assert "completed_jobs" in data
        assert "failed_jobs" in data
        assert "total_videos_found" in data

    async def test_stats_values_are_non_negative(self, client, auth_headers):
        resp = await client.get("/api/v1/crawler/stats", headers=auth_headers)
        data = resp.json()
        for key, val in data.items():
            assert val >= 0, f"{key} should be >= 0"

    async def test_stats_unauthenticated(self, client):
        resp = await client.get("/api/v1/crawler/stats")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestCrawlerJobs:
    async def test_list_jobs_empty(self, client, auth_headers):
        resp = await client.get("/api/v1/crawler/jobs", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_jobs_pagination(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/crawler/jobs",
            headers=auth_headers,
            params={"limit": 5},
        )
        assert resp.status_code == 200
        assert len(resp.json()) <= 5

    async def test_start_job_tiktok_trending(self, client, auth_headers, mocker):
        mocker.patch(
            "backend.workers.crawler_worker.crawl_platform_task.delay",
            return_value=None,
        )
        resp = await client.post(
            "/api/v1/crawler/jobs/start",
            headers=auth_headers,
            params={"platform": "tiktok", "job_type": "trending"},
        )
        assert resp.status_code in (200, 201, 202)
        data = resp.json()
        assert "job_id" in data or "id" in data

    async def test_start_job_instagram_hashtag(self, client, auth_headers, mocker):
        mocker.patch(
            "backend.workers.crawler_worker.crawl_platform_task.delay",
            return_value=None,
        )
        resp = await client.post(
            "/api/v1/crawler/jobs/start",
            headers=auth_headers,
            params={
                "platform": "instagram",
                "job_type": "hashtag_scan",
                "target": "tiktokmademebuyit",
            },
        )
        assert resp.status_code in (200, 201, 202)

    async def test_start_job_invalid_platform(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/crawler/jobs/start",
            headers=auth_headers,
            params={"platform": "myspace", "job_type": "trending"},
        )
        assert resp.status_code == 422

    async def test_start_job_missing_platform(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/crawler/jobs/start",
            headers=auth_headers,
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestHashtagScan:
    async def test_hashtag_scan_queues_tasks(self, client, auth_headers, mocker):
        mocker.patch(
            "backend.workers.crawler_worker.scan_hashtags_task.delay",
            return_value=None,
        )
        resp = await client.post("/api/v1/crawler/hashtag-scan", headers=auth_headers)
        assert resp.status_code in (200, 202)
        data = resp.json()
        assert "queued" in str(data).lower() or "message" in data

    async def test_hashtag_scan_unauthenticated(self, client):
        resp = await client.post("/api/v1/crawler/hashtag-scan")
        assert resp.status_code == 401
