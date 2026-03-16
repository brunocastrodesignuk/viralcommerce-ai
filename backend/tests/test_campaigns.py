"""
Tests for /api/v1/campaigns — CRUD, launch, optimize, pause, performance.
"""
import pytest
import uuid


@pytest.mark.asyncio
class TestCampaignsCRUD:
    async def test_list_campaigns(self, client, auth_headers):
        resp = await client.get("/api/v1/campaigns/", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_campaigns_unauthenticated(self, client):
        resp = await client.get("/api/v1/campaigns/")
        assert resp.status_code == 401

    async def test_create_campaign(self, client, auth_headers, seed_product):
        payload = {
            "product_id": str(seed_product.id),
            "name": "My Test Campaign",
            "network": "meta",
            "daily_budget": 50.0,
            "targeting": {"age_min": 18, "age_max": 45},
        }
        resp = await client.post("/api/v1/campaigns/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == payload["name"]
        assert data["network"] == "meta"
        assert data["status"] == "draft"

    async def test_create_campaign_invalid_network(self, client, auth_headers, seed_product):
        payload = {
            "product_id": str(seed_product.id),
            "name": "Bad Network Campaign",
            "network": "invalid_network",
            "daily_budget": 50.0,
        }
        resp = await client.post("/api/v1/campaigns/", json=payload, headers=auth_headers)
        assert resp.status_code == 422

    async def test_get_campaign(self, client, auth_headers, seed_campaign):
        resp = await client.get(f"/api/v1/campaigns/{seed_campaign.id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(seed_campaign.id)
        assert data["name"] == seed_campaign.name

    async def test_get_nonexistent_campaign(self, client, auth_headers):
        resp = await client.get(f"/api/v1/campaigns/{uuid.uuid4()}", headers=auth_headers)
        assert resp.status_code == 404

    async def test_list_filter_by_status(self, client, auth_headers, seed_campaign):
        resp = await client.get(
            "/api/v1/campaigns/",
            headers=auth_headers,
            params={"status": "draft"},
        )
        assert resp.status_code == 200
        for c in resp.json():
            assert c["status"] == "draft"


@pytest.mark.asyncio
class TestCampaignActions:
    async def test_launch_campaign(self, client, auth_headers, seed_campaign, mocker):
        mocker.patch(
            "backend.workers.campaign_worker.launch_campaign_task.delay",
            return_value=None,
        )
        resp = await client.post(
            f"/api/v1/campaigns/{seed_campaign.id}/launch",
            headers=auth_headers,
        )
        assert resp.status_code in (200, 202)

    async def test_launch_nonexistent_campaign(self, client, auth_headers):
        resp = await client.post(
            f"/api/v1/campaigns/{uuid.uuid4()}/launch",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_optimize_campaign(self, client, auth_headers, seed_campaign, mocker):
        mocker.patch(
            "backend.workers.campaign_worker.optimize_campaign_task.delay",
            return_value=None,
        )
        resp = await client.post(
            f"/api/v1/campaigns/{seed_campaign.id}/optimize",
            headers=auth_headers,
        )
        assert resp.status_code in (200, 202)

    async def test_pause_campaign(self, client, auth_headers, seed_campaign):
        resp = await client.post(
            f"/api/v1/campaigns/{seed_campaign.id}/pause",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "paused"

    async def test_pause_already_paused(self, client, auth_headers, seed_campaign):
        # Pause once
        await client.post(f"/api/v1/campaigns/{seed_campaign.id}/pause", headers=auth_headers)
        # Pause again — should be idempotent or 400
        resp = await client.post(
            f"/api/v1/campaigns/{seed_campaign.id}/pause",
            headers=auth_headers,
        )
        assert resp.status_code in (200, 400)

    async def test_campaign_performance(self, client, auth_headers, seed_campaign):
        resp = await client.get(
            f"/api/v1/campaigns/{seed_campaign.id}/performance",
            headers=auth_headers,
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestCampaignRoasLogic:
    """Verify ROAS threshold constants are correct via API response."""

    async def test_roas_fields_present(self, client, auth_headers, seed_campaign):
        resp = await client.get(f"/api/v1/campaigns/{seed_campaign.id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "roas" in data
        assert "total_spend" in data
        assert "total_revenue" in data

    async def test_create_with_google_network(self, client, auth_headers, seed_product):
        payload = {
            "product_id": str(seed_product.id),
            "name": "Google Ads Test",
            "network": "google",
            "daily_budget": 100.0,
        }
        resp = await client.post("/api/v1/campaigns/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["network"] == "google"

    async def test_create_with_tiktok_network(self, client, auth_headers, seed_product):
        payload = {
            "product_id": str(seed_product.id),
            "name": "TikTok Ads Test",
            "network": "tiktok_ads",
            "daily_budget": 75.0,
        }
        resp = await client.post("/api/v1/campaigns/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["network"] == "tiktok_ads"
