"""2GIS Catalog (Places) API adapter.

Requires TWOGIS_API_KEY. Note: contact_groups (phones/emails/site) require an
extended paid permission from 2GIS; without it, contacts may be empty.
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.services.parser.geo import geocode
from app.services.parser.osm import RawCompany

SEARCH_URL = "https://catalog.api.2gis.com/3.0/items"
FIELDS = "items.point,items.contact_groups,items.rubrics,items.reviews,items.external_content"


class TwoGISParser:
    source = "2gis"

    def _extract_contacts(self, item: dict) -> dict:
        out = {"phone": None, "email": None, "website": None, "socials": {}}
        for group in item.get("contact_groups", []) or []:
            for c in group.get("contacts", []) or []:
                ctype = c.get("type")
                value = c.get("value") or c.get("url") or c.get("text")
                if ctype == "phone" and not out["phone"]:
                    out["phone"] = value
                elif ctype == "email" and not out["email"]:
                    out["email"] = value
                elif ctype in ("website", "url") and not out["website"]:
                    out["website"] = c.get("url") or value
                elif ctype in ("instagram", "facebook", "vk", "telegram"):
                    out["socials"][ctype] = c.get("url") or value
        return out

    async def search(
        self,
        query: str,
        city: str | None = None,
        country: str | None = None,
        region: str | None = None,
        radius_km: float | None = None,
        limit: int = 50,
    ) -> list[RawCompany]:
        if not settings.TWOGIS_API_KEY:
            raise RuntimeError("TWOGIS_API_KEY is not configured")

        place = ", ".join(x for x in [city, region, country] if x) or query
        params: dict = {
            "key": settings.TWOGIS_API_KEY,
            "q": query,
            "locale": "ru_RU",
            "page_size": min(limit, 50),
            "page": 1,
            "fields": FIELDS,
        }
        center = await geocode(place)
        if center:
            lat, lng = center
            params["point"] = f"{lng},{lat}"
            params["radius"] = int(min((radius_km or 15) * 1000, 40000))

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(SEARCH_URL, params=params)
            r.raise_for_status()
            data = r.json()

        items = (data.get("result") or {}).get("items", [])
        results: list[RawCompany] = []
        for item in items:
            name = item.get("name")
            if not name:
                continue
            contacts = self._extract_contacts(item)
            point = item.get("point") or {}
            reviews = item.get("reviews") or {}
            rubrics = item.get("rubrics") or []
            results.append(
                RawCompany(
                    source=self.source,
                    external_id=str(item.get("id")) if item.get("id") else None,
                    name=name,
                    category=rubrics[0]["name"] if rubrics else None,
                    address=item.get("full_name") or item.get("address_name"),
                    city=city,
                    country=country,
                    lat=point.get("lat"),
                    lng=point.get("lon"),
                    phone=contacts["phone"],
                    email=contacts["email"],
                    website=contacts["website"],
                    socials=contacts["socials"],
                    rating=reviews.get("rating"),
                    reviews_count=reviews.get("review_count"),
                )
            )
        return results[:limit]
