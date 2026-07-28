"""OAuth2 token helpers for Google and Microsoft (refresh / client-credentials)."""
from __future__ import annotations

import httpx

from app.core.config import settings

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


async def google_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    """Exchange a Google refresh token for a short-lived access token."""
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(GOOGLE_TOKEN_URL, data=data)
        r.raise_for_status()
        return r.json()["access_token"]


async def microsoft_access_token() -> str:
    """Get a Microsoft Graph access token (app-only or delegated refresh)."""
    tenant = settings.MS_TENANT_ID or "common"
    url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
    if settings.MS_APP_ONLY:
        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }
    else:
        data = {
            "client_id": settings.MS_CLIENT_ID,
            "client_secret": settings.MS_CLIENT_SECRET,
            "refresh_token": settings.MS_REFRESH_TOKEN,
            "scope": "https://graph.microsoft.com/Mail.Send offline_access",
            "grant_type": "refresh_token",
        }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, data=data)
        r.raise_for_status()
        return r.json()["access_token"]
