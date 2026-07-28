"""Google Places API (New) business search adapter.

Requires GOOGLE_MAPS_API_KEY. Uses Text Search with an optional location
restriction circle derived from the city center (geocoded via Nominatim).
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.services.parser.geo import geocode
from app.services.parser.osm import RawCompany

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.internationalPhoneNumber,places.websiteUri,places.rating,"
    "places.userRatingCount,places.location,places.primaryType"
)


class GooglePlacesParser:
    source = "google_maps"

    async def search(
        self,
        query: str,
        city: str | None = None,
        country: str | None = None,
        region: str | None = None,
        radius_km: float | None = None,
        limit: int = 50,
    ) -> list[RawCompany]:
        if not settings.GOOGLE_MAPS_API_KEY:
            raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

        place = ", ".join(x for x in [city, region, country] if x)
        body: dict = {
            "textQuery": f"{query} {place}".strip(),
            "languageCode": "ru",
            "maxResultCount": min(limit, 20),
        }
        if country:
            body["regionCode"] = country[:2].upper()

        if city:
            center = await geocode(place or city)
            if center:
                lat, lng = center
                body["locationBias"] = {
                    "circle": {
                        "center": {"latitude": lat, "longitude": lng},
                        "radius": float(min((radius_km or 15) * 1000, 50000)),
                    }
                }

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(SEARCH_URL, json=body, headers=headers)
            r.raise_for_status()
            data = r.json()

        results: list[RawCompany] = []
        for p in data.get("places", []):
            name = (p.get("displayName") or {}).get("text", "")
            if not name:
                continue
            loc = p.get("location", {})
            results.append(
                RawCompany(
                    source=self.source,
                    external_id=p.get("id"),
                    name=name,
                    category=p.get("primaryType"),
                    address=p.get("formattedAddress"),
                    city=city,
                    country=country,
                    lat=loc.get("latitude"),
                    lng=loc.get("longitude"),
                    phone=p.get("internationalPhoneNumber"),
                    website=p.get("websiteUri"),
                    rating=p.get("rating"),
                    reviews_count=p.get("userRatingCount"),
                )
            )
        return results[:limit]
