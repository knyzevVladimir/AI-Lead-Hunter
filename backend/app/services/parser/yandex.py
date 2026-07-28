"""Yandex Maps Geosearch API ("Поиск по организациям") adapter.

Requires YANDEX_MAPS_API_KEY. Returns GeoJSON business features.
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.services.parser.geo import geocode, km_to_deg
from app.services.parser.osm import RawCompany

SEARCH_URL = "https://search-maps.yandex.ru/v1/"


class YandexMapsParser:
    source = "yandex_maps"

    async def search(
        self,
        query: str,
        city: str | None = None,
        country: str | None = None,
        region: str | None = None,
        radius_km: float | None = None,
        limit: int = 50,
    ) -> list[RawCompany]:
        if not settings.YANDEX_MAPS_API_KEY:
            raise RuntimeError("YANDEX_MAPS_API_KEY is not configured")

        place = ", ".join(x for x in [city, region, country] if x) or query
        params: dict = {
            "apikey": settings.YANDEX_MAPS_API_KEY,
            "text": f"{query} {place}".strip(),
            "type": "biz",
            "lang": "ru_RU",
            "results": min(limit, 100),
        }
        center = await geocode(place)
        if center:
            lat, lng = center
            params["ll"] = f"{lng},{lat}"
            d = km_to_deg(radius_km or 15)
            params["spn"] = f"{d},{d}"

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(SEARCH_URL, params=params)
            r.raise_for_status()
            data = r.json()

        results: list[RawCompany] = []
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            meta = props.get("CompanyMetaData", {})
            name = meta.get("name")
            if not name:
                continue
            coords = (feat.get("geometry") or {}).get("coordinates", [None, None])
            phones = meta.get("Phones") or []
            categories = meta.get("Categories") or []
            results.append(
                RawCompany(
                    source=self.source,
                    external_id=meta.get("id"),
                    name=name,
                    category=categories[0]["name"] if categories else None,
                    address=(meta.get("address") or (meta.get("Address") or {}).get("formatted")),
                    city=city,
                    country=country,
                    lat=coords[1] if len(coords) > 1 else None,
                    lng=coords[0] if coords else None,
                    phone=phones[0].get("formatted") if phones else None,
                    website=meta.get("url"),
                    opening_hours=(meta.get("Hours") or {}).get("text"),
                )
            )
        return results[:limit]
