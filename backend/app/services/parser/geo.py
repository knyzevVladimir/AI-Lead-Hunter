"""Shared geocoding helper (Nominatim, key-free) used by all map providers."""
from __future__ import annotations

import httpx

from app.core.config import settings


async def geocode(place: str) -> tuple[float, float] | None:
    """Resolve a place name to (lat, lon). Returns None if not found."""
    params = {"q": place, "format": "json", "limit": 1}
    headers = {"User-Agent": settings.USER_AGENT}
    async with httpx.AsyncClient(timeout=20, headers=headers) as client:
        r = await client.get(f"{settings.NOMINATIM_URL}/search", params=params)
        r.raise_for_status()
        data = r.json()
        if not data:
            return None
        return float(data[0]["lat"]), float(data[0]["lon"])


def km_to_deg(radius_km: float) -> float:
    """Approximate degrees for a given radius in km (~111 km per degree)."""
    return max(0.01, radius_km / 111.0)
