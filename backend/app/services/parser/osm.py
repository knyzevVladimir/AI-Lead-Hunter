"""OpenStreetMap business parser.

Uses the public, key-free Nominatim (geocoding) and Overpass (POI query) APIs.
This is a fully working data source out of the box. Google/Yandex/2GIS
adapters can be added under the same interface using their API keys.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import settings

# Map human category keywords (RU + EN) to OSM tag selectors.
# Each selector is an Overpass tag filter fragment like '"amenity"="cafe"'.
CATEGORY_MAP: dict[str, list[str]] = {
    "барбершоп": ['"shop"="hairdresser"'],
    "barbershop": ['"shop"="hairdresser"'],
    "парикмахерская": ['"shop"="hairdresser"'],
    "салон красоты": ['"shop"="beauty"', '"shop"="hairdresser"'],
    "beauty": ['"shop"="beauty"'],
    "стоматология": ['"amenity"="dentist"', '"healthcare"="dentist"'],
    "dentist": ['"amenity"="dentist"'],
    "клиника": ['"amenity"="clinic"', '"healthcare"="clinic"'],
    "clinic": ['"amenity"="clinic"'],
    "кафе": ['"amenity"="cafe"'],
    "cafe": ['"amenity"="cafe"'],
    "ресторан": ['"amenity"="restaurant"'],
    "restaurant": ['"amenity"="restaurant"'],
    "фитнес": ['"leisure"="fitness_centre"'],
    "gym": ['"leisure"="fitness_centre"'],
    "автосервис": ['"shop"="car_repair"'],
    "car repair": ['"shop"="car_repair"'],
    "юрист": ['"office"="lawyer"'],
    "lawyer": ['"office"="lawyer"'],
    "отель": ['"tourism"="hotel"'],
    "hotel": ['"tourism"="hotel"'],
    "магазин": ['"shop"'],
    "shop": ['"shop"'],
}


@dataclass
class RawCompany:
    source: str = "openstreetmap"
    external_id: str | None = None
    name: str = ""
    category: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    lat: float | None = None
    lng: float | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    socials: dict[str, str] = field(default_factory=dict)
    rating: float | None = None
    reviews_count: int | None = None
    opening_hours: str | None = None
    description: str | None = None


def _selectors_for(query: str) -> list[str]:
    q = query.strip().lower()
    for key, sels in CATEGORY_MAP.items():
        if key in q:
            return sels
    # Fallback: name-based fuzzy search across common POI keys
    safe = query.replace('"', "").replace("\\", "")
    return [f'"name"~"{safe}",i']


def osm_category_values(query: str) -> list[str]:
    """Return the concrete OSM tag values (e.g. ['hairdresser']) that a human
    category keyword maps to. Used to translate NL queries into stored-category
    filters. Returns [] for wildcard/name-fuzzy matches."""
    q = query.strip().lower()
    values: list[str] = []
    for key, sels in CATEGORY_MAP.items():
        if key in q:
            for sel in sels:
                if "=" in sel:
                    val = sel.split("=", 1)[1].strip().strip('"')
                    values.append(val)
            break
    return values


class OSMParser:
    def __init__(self) -> None:
        self._headers = {"User-Agent": settings.USER_AGENT}

    async def geocode(self, place: str) -> tuple[float, float] | None:
        """Resolve a place name to (lat, lon) using Nominatim."""
        params = {"q": place, "format": "json", "limit": 1}
        async with httpx.AsyncClient(timeout=20, headers=self._headers) as client:
            r = await client.get(f"{settings.NOMINATIM_URL}/search", params=params)
            r.raise_for_status()
            data = r.json()
            if not data:
                return None
            return float(data[0]["lat"]), float(data[0]["lon"])

    def _build_query(self, selectors: list[str], lat: float, lng: float, radius_m: int, limit: int) -> str:
        parts = "\n".join(f"  nwr[{sel}](around:{radius_m},{lat},{lng});" for sel in selectors)
        return f"[out:json][timeout:30];\n(\n{parts}\n);\nout center tags {limit};"

    def _parse_element(self, el: dict[str, Any], fallback_city: str | None) -> RawCompany | None:
        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("brand")
        if not name:
            return None

        lat = el.get("lat") or (el.get("center") or {}).get("lat")
        lng = el.get("lon") or (el.get("center") or {}).get("lon")

        socials = {}
        for net in ("instagram", "facebook", "vk", "telegram", "tiktok", "linkedin"):
            val = tags.get(f"contact:{net}") or tags.get(net)
            if val:
                socials[net] = val

        street = tags.get("addr:street")
        house = tags.get("addr:housenumber")
        address = " ".join(x for x in [street, house] if x) or None

        category = (
            tags.get("shop")
            or tags.get("amenity")
            or tags.get("healthcare")
            or tags.get("leisure")
            or tags.get("office")
            or tags.get("tourism")
        )

        return RawCompany(
            external_id=f"{el.get('type')}/{el.get('id')}",
            name=name,
            category=category,
            address=address,
            city=tags.get("addr:city") or fallback_city,
            country=tags.get("addr:country"),
            lat=lat,
            lng=lng,
            phone=tags.get("phone") or tags.get("contact:phone"),
            email=tags.get("email") or tags.get("contact:email"),
            website=tags.get("website") or tags.get("contact:website") or tags.get("url"),
            socials=socials,
            opening_hours=tags.get("opening_hours"),
            description=tags.get("description"),
        )

    async def search(
        self,
        query: str,
        city: str | None = None,
        country: str | None = None,
        region: str | None = None,
        radius_km: float | None = None,
        limit: int = 50,
    ) -> list[RawCompany]:
        """Search for businesses. Returns normalized RawCompany objects."""
        place = ", ".join(x for x in [city, region, country] if x) or query
        center = await self.geocode(place)
        if center is None:
            return []
        lat, lng = center
        radius_m = int((radius_km or 15) * 1000)
        selectors = _selectors_for(query)
        overpass_q = self._build_query(selectors, lat, lng, radius_m, limit)

        async with httpx.AsyncClient(timeout=45, headers=self._headers) as client:
            r = await client.post(settings.OVERPASS_URL, data={"data": overpass_q})
            r.raise_for_status()
            payload = r.json()

        results: list[RawCompany] = []
        for el in payload.get("elements", []):
            parsed = self._parse_element(el, city)
            if parsed:
                results.append(parsed)
        # de-duplicate by name+coords
        seen: set[tuple] = set()
        unique: list[RawCompany] = []
        for c in results:
            key = (c.name, round(c.lat or 0, 5), round(c.lng or 0, 5))
            if key not in seen:
                seen.add(key)
                unique.append(c)
        return unique[:limit]


parser = OSMParser()
