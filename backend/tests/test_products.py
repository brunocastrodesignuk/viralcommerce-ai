"""
Tests for /api/v1/products — list, trending, get by id, suppliers, marketing.
"""
import pytest
import uuid


@pytest.mark.asyncio
class TestProductsList:
    async def test_list_returns_200(self, client, auth_headers):
        resp = await client.get("/api/v1/products/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)

    async def test_list_unauthenticated(self, client):
        resp = await client.get("/api/v1/products/")
        assert resp.status_code == 401

    async def test_list_filter_by_category(self, client, auth_headers, seed_product):
        resp = await client.get(
            "/api/v1/products/",
            headers=auth_headers,
            params={"category": seed_product.category},
        )
        assert resp.status_code == 200
        items = resp.json()["items"]
        for item in items:
            assert item["category"] == seed_product.category

    async def test_list_filter_min_viral_score(self, client, auth_headers, seed_product):
        # seed_product has viral_score=85
        resp = await client.get(
            "/api/v1/products/",
            headers=auth_headers,
            params={"min_viral_score": 90},
        )
        assert resp.status_code == 200
        for item in resp.json()["items"]:
            assert item["viral_score"] >= 90

    async def test_list_pagination(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/products/",
            headers=auth_headers,
            params={"page": 1, "limit": 5},
        )
        assert resp.status_code == 200
        assert len(resp.json()["items"]) <= 5

    async def test_list_invalid_page(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/products/",
            headers=auth_headers,
            params={"page": -1},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestProductsTrending:
    async def test_trending_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v1/products/trending", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_trending_respects_limit(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/products/trending",
            headers=auth_headers,
            params={"limit": 3},
        )
        assert resp.status_code == 200
        assert len(resp.json()) <= 3

    async def test_trending_sorted_by_viral_score(self, client, auth_headers, seed_product):
        resp = await client.get("/api/v1/products/trending", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.json()
        scores = [item["viral_score"] for item in items]
        assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
class TestProductDetail:
    async def test_get_by_id(self, client, auth_headers, seed_product):
        resp = await client.get(f"/api/v1/products/{seed_product.id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(seed_product.id)
        assert data["name"] == seed_product.name
        assert data["viral_score"] == seed_product.viral_score

    async def test_get_nonexistent(self, client, auth_headers):
        fake_id = uuid.uuid4()
        resp = await client.get(f"/api/v1/products/{fake_id}", headers=auth_headers)
        assert resp.status_code == 404

    async def test_get_invalid_uuid(self, client, auth_headers):
        resp = await client.get("/api/v1/products/not-a-uuid", headers=auth_headers)
        assert resp.status_code == 422

    async def test_get_suppliers(self, client, auth_headers, seed_product):
        resp = await client.get(
            f"/api/v1/products/{seed_product.id}/suppliers",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_find_suppliers_queues_task(self, client, auth_headers, seed_product, mocker):
        # Mock Celery task to avoid needing a real worker
        mocker.patch(
            "backend.workers.supplier_worker.discover_suppliers_task.delay",
            return_value=None,
        )
        resp = await client.post(
            f"/api/v1/products/{seed_product.id}/find-suppliers",
            headers=auth_headers,
        )
        assert resp.status_code == 202
        assert "queued" in resp.json().get("message", "").lower()

    async def test_viral_history(self, client, auth_headers, seed_product):
        resp = await client.get(
            f"/api/v1/products/{seed_product.id}/viral-history",
            headers=auth_headers,
            params={"days": 7},
        )
        assert resp.status_code == 200
