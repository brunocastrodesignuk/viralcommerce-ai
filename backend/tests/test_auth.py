"""
Tests for /api/v1/auth — register, login, token refresh, /me endpoint.
"""
import pytest
import uuid


@pytest.mark.asyncio
class TestRegister:
    async def test_register_success(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "email": f"new_{uuid.uuid4().hex[:6]}@example.com",
            "password": "StrongPass1!",
            "full_name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data["email"].endswith("@example.com")
        assert "hashed_password" not in data  # never expose hash

    async def test_register_duplicate_email(self, client, registered_user):
        resp = await client.post("/api/v1/auth/register", json={
            "email": registered_user["email"],
            "password": "AnotherPass1!",
            "full_name": "Duplicate",
        })
        assert resp.status_code == 400
        assert "already" in resp.json()["detail"].lower()

    async def test_register_invalid_email(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "StrongPass1!",
            "full_name": "Bad Email",
        })
        assert resp.status_code == 422  # Pydantic validation

    async def test_register_weak_password(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "email": f"weak_{uuid.uuid4().hex[:6]}@example.com",
            "password": "123",
            "full_name": "Weak Pass",
        })
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, client, registered_user):
        resp = await client.post(
            "/api/v1/auth/token",
            data={"username": registered_user["email"], "password": registered_user["password"]},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client, registered_user):
        resp = await client.post(
            "/api/v1/auth/token",
            data={"username": registered_user["email"], "password": "WrongPass999!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_email(self, client):
        resp = await client.post(
            "/api/v1/auth/token",
            data={"username": "nobody@nowhere.com", "password": "Pass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestMe:
    async def test_get_me_authenticated(self, client, auth_headers, registered_user):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == registered_user["email"]
        assert "hashed_password" not in data

    async def test_get_me_unauthenticated(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    async def test_get_me_invalid_token(self, client):
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer totally.invalid.token"},
        )
        assert resp.status_code == 401
