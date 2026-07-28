"""Yandex Maps business parser — **key-free** (web scraper).

Instead of the paid Geosearch API (which needs ``YANDEX_MAPS_API_KEY``), this
adapter reads the public Yandex Maps search results page and extracts the
business data that Yandex itself embeds in the page as JSON.

How it works
------------
When you open ``https://yandex.ru/maps/?text=<query>&ll=<lng>,<lat>&z=<zoom>``
the server renders the full first page of organisation cards and embeds the
whole application state as JSON inside::

    <script class="state-view" type="application/json"> … </script>

The organisations live at ``stack[0].results.items`` and carry everything we
need: title, categories, address, coordinates, phones, website, social links,
rating and review counts, working hours. No API key and no token handshake are
required for this first page — it is plain HTML.

Pagination (results beyond the ~25 embedded on page 1) is attempted through
Yandex's internal ``/maps/api/search`` JSON endpoint on a best-effort basis:
it reuses the same session cookies and CSRF token. If that endpoint is
unavailable (e.g. Yandex anti-bot throttles a datacenter IP), the parser simply
returns the first page instead of failing — and the pipeline can additionally
fall back to OpenStreetMap.

Geocoding (city name -> lat/lng) reuses the shared, key-free Nominatim helper.

The returned objects use the same :class:`RawCompany` shape as every other
provider, so the rest of the pipeline is unchanged.
"""
from __future__ import annotations

import asyncio
import html as _html
import json
import logging
import re
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

import httpx

from app.core.config import settings
from app.services.parser.geo import geocode, km_to_deg
from app.services.parser.osm import RawCompany
from app.services.parser.resilience import (
    ScraperBlockedError,
    get_with_retries,
    pick_user_agent,
)

logger = logging.getLogger(__name__)

# Markers of Yandex's anti-bot walls (regular captcha, smart captcha, and the
# "confirm you're not a robot" interstitial). Centralised so new markers are
# easy to add when Yandex changes its block pages.
_CAPTCHA_RE = re.compile(
    r"captcha|showcaptcha|smartcaptcha|are you not a robot|checkbox-captcha",
    re.I,
)

# The <script> that carries the embedded application state.
_STATE_RE = re.compile(
    r'<script[^>]*class="[^"]*state-view[^"]*"[^>]*>(.*?)</script>', re.S
)
_SESSION_RE = re.compile(r'"sessionId"\s*:\s*"(\d+)"')
_CSRF_RE = re.compile(r'"csrfToken"\s*:\s*"([A-Za-z0-9]+(?::\d+)?)"')

# Query-string keys that are pure tracking noise on business websites.
_TRACKING_PARAMS = {
    "yclid", "utm_source", "utm_medium", "utm_campaign", "utm_content",
    "utm_term", "utm_referrer", "_openstat", "from", "source", "clid",
    "etext", "gclid", "fbclid", "ymclid",
}

# Which Yandex socialLinks "type" values we treat as social/contact profiles.
_SOCIAL_TYPES = {
    "vkontakte": "vk", "vk": "vk", "instagram": "instagram", "facebook": "facebook",
    "telegram": "telegram", "whatsapp": "whatsapp", "youtube": "youtube",
    "twitter": "twitter", "ok": "odnoklassniki", "odnoklassniki": "odnoklassniki",
    "tiktok": "tiktok", "viber": "viber", "linkedin": "linkedin",
}


# --------------------------------------------------------------------------- #
# Pure parsing helpers (no network) — unit-testable in isolation.
# --------------------------------------------------------------------------- #
def _extract_state(html_text: str) -> dict | None:
    """Pull and decode the embedded ``state-view`` JSON blob. None if absent."""
    m = _STATE_RE.search(html_text)
    if not m:
        return None
    try:
        return json.loads(_html.unescape(m.group(1)))
    except (ValueError, TypeError):
        return None


def _items_from_state(state: dict) -> list[dict]:
    """Return the list of organisation dicts embedded in the SERP state."""
    try:
        stack = state.get("stack") or []
        for frame in stack:
            results = (frame or {}).get("results") or {}
            items = results.get("items")
            if isinstance(items, list) and items:
                return items
    except AttributeError:
        pass
    return []


def _items_from_api(payload: dict) -> list[dict]:
    """Extract organisation dicts from an internal /maps/api/search response.

    The API returns the same per-item shape as the embedded SERP state under a
    ``data`` envelope, so the item mapper below is shared between both paths.
    """
    if not isinstance(payload, dict):
        return []
    for holder in (payload.get("data"), payload):
        if isinstance(holder, dict):
            items = holder.get("items")
            if isinstance(items, list) and items:
                return items
    return []


def _clean_website(url: str | None) -> str | None:
    """Drop advertising/tracking query params from a business URL."""
    if not url:
        return None
    try:
        parts = urlsplit(url)
    except ValueError:
        return url
    kept = [(k, v) for k, v in parse_qsl(parts.query) if k.lower() not in _TRACKING_PARAMS]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(kept), ""))


def _pick_phone(item: dict) -> str | None:
    phones = item.get("phones") or []
    if phones and isinstance(phones, list):
        first = phones[0] or {}
        return first.get("number") or first.get("value") or first.get("formatted")
    return None


def _pick_website(item: dict) -> str | None:
    urls = item.get("urls") or item.get("links") or []
    if isinstance(urls, list) and urls:
        first = urls[0]
        if isinstance(first, dict):
            first = first.get("url") or first.get("href")
        return _clean_website(first)
    return None


def _pick_socials(item: dict) -> tuple[dict[str, str], str | None]:
    """Return (socials, email) extracted from socialLinks / links."""
    socials: dict[str, str] = {}
    email: str | None = None
    for link in item.get("socialLinks") or []:
        if not isinstance(link, dict):
            continue
        ltype = (link.get("type") or "").lower()
        href = link.get("href") or link.get("readableHref")
        if not href:
            continue
        if ltype in ("email", "mail"):
            email = email or href.replace("mailto:", "")
        elif ltype in _SOCIAL_TYPES:
            socials.setdefault(_SOCIAL_TYPES[ltype], href)
    return socials, email


def _item_to_company(item: dict, source: str, city: str | None, country: str | None) -> RawCompany | None:
    """Map one Yandex organisation dict to a normalized :class:`RawCompany`."""
    if not isinstance(item, dict):
        return None
    name = item.get("title") or item.get("name") or item.get("shortTitle")
    if not name:
        return None

    categories = item.get("categories") or []
    category = None
    if categories and isinstance(categories, list) and isinstance(categories[0], dict):
        category = categories[0].get("name")

    coords = item.get("coordinates") or item.get("displayCoordinates") or []
    lng = coords[0] if isinstance(coords, list) and len(coords) > 0 else None
    lat = coords[1] if isinstance(coords, list) and len(coords) > 1 else None

    rating_data = item.get("ratingData") or {}
    rating = rating_data.get("ratingValue")
    reviews = rating_data.get("reviewCount")
    if reviews is None:
        reviews = rating_data.get("ratingCount")

    socials, email = _pick_socials(item)

    ext = item.get("id") or item.get("businessId") or item.get("seoname")

    return RawCompany(
        source=source,
        external_id=str(ext) if ext is not None else None,
        name=name,
        category=category,
        address=item.get("fullAddress") or item.get("address"),
        city=city,
        country=item.get("country") or country,
        lat=float(lat) if lat is not None else None,
        lng=float(lng) if lng is not None else None,
        phone=_pick_phone(item),
        email=email,
        website=_pick_website(item),
        socials=socials,
        rating=round(float(rating), 1) if isinstance(rating, (int, float)) else None,
        reviews_count=int(reviews) if isinstance(reviews, (int, float)) else None,
        opening_hours=item.get("workingTimeText"),
        description=item.get("description"),
    )


def _zoom_for_radius(radius_km: float | None) -> int:
    """Pick a Yandex map zoom level that roughly covers the search radius."""
    r = radius_km or 15
    if r <= 3:
        return 15
    if r <= 7:
        return 14
    if r <= 15:
        return 12
    if r <= 30:
        return 11
    return 10


# --------------------------------------------------------------------------- #
# Parser
# --------------------------------------------------------------------------- #
class YandexMapsParser:
    """Key-free Yandex Maps organisation search via the public web SERP."""

    source = "yandex_maps"

    def _base(self) -> str:
        return (settings.YANDEX_MAPS_BASE_URL or "https://yandex.ru/maps/").rstrip("/") + "/"

    def _origin(self) -> str:
        s = urlsplit(self._base())
        return f"{s.scheme}://{s.netloc}"

    def _headers(self, user_agent: str | None = None) -> dict[str, str]:
        return {
            "User-Agent": user_agent or settings.YANDEX_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ru,en;q=0.9",
            "Upgrade-Insecure-Requests": "1",
        }

    async def search(
        self,
        query: str,
        city: str | None = None,
        country: str | None = None,
        region: str | None = None,
        radius_km: float | None = None,
        limit: int = 50,
    ) -> list[RawCompany]:
        place = ", ".join(x for x in [city, region, country] if x)
        center = await geocode(place) if place else None

        # Build the search text. With coordinates we keep the query tight to the
        # category; without them we append the place so text search still works.
        text = query if center else f"{query} {place}".strip()
        base = self._base()
        params: dict[str, str | int] = {"text": text, "z": _zoom_for_radius(radius_km)}
        if center:
            lat, lng = center
            params["ll"] = f"{lng},{lat}"
            d = km_to_deg(radius_km or 15)
            params["spn"] = f"{d},{d}"

        timeout = httpx.Timeout(settings.YANDEX_SCRAPER_TIMEOUT)
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=True
        ) as client:
            # Retry the SERP fetch across rotating User-Agents: a single
            # throttled identity should not sink the whole search.
            html_text: str | None = None
            last_error: Exception | None = None
            ua: str | None = None
            for attempt in range(settings.YANDEX_SCRAPER_RETRIES):
                ua = pick_user_agent(settings.YANDEX_USER_AGENT, exclude=ua)
                try:
                    resp = await get_with_retries(
                        client, base, params=params, headers=self._headers(ua)
                    )
                    html_text = resp.text
                    break
                except httpx.HTTPStatusError as e:
                    last_error = e
                    if e.response.status_code == 403 and attempt < settings.YANDEX_SCRAPER_RETRIES - 1:
                        logger.info("Yandex SERP 403 (attempt %d), rotating UA", attempt + 1)
                        await asyncio.sleep(1.0 * (attempt + 1))
                        continue
                    raise
                except httpx.HTTPError as e:
                    last_error = e
                    if attempt < settings.YANDEX_SCRAPER_RETRIES - 1:
                        logger.info("Yandex SERP network error (attempt %d): %s", attempt + 1, e)
                        continue
                    raise

            if html_text is None:
                raise RuntimeError(f"Yandex Maps: SERP fetch failed: {last_error}")

            # Anti-bot walls can arrive with a 200 status — always sniff the body.
            if _CAPTCHA_RE.search(html_text) and _extract_state(html_text) is None:
                raise ScraperBlockedError(
                    "Яндекс.Карты показали капчу (анти-бот защита). "
                    "Поиск автоматически переключён на OpenStreetMap. "
                    "Повторите позже или смените IP/настройте прокси для Яндекса."
                )

            state = _extract_state(html_text)
            if state is None:
                raise RuntimeError(
                    "Yandex Maps: could not locate embedded results in the page "
                    "(markup changed or empty SERP)"
                )

            results: list[RawCompany] = [
                c for c in (
                    _item_to_company(it, self.source, city, country)
                    for it in _items_from_state(state)
                ) if c is not None
            ]

            # Best-effort pagination through the internal JSON API.
            if len(results) < limit:
                try:
                    more = await self._paginate(
                        client, state, html_text, text, center, radius_km,
                        already=len(results), limit=limit,
                    )
                    results.extend(more)
                except Exception:  # noqa: BLE001 — pagination is optional, never fatal
                    pass

        return self._dedupe(results)[:limit]

    async def _paginate(
        self,
        client: httpx.AsyncClient,
        state: dict,
        html_text: str,
        text: str,
        center: tuple[float, float] | None,
        radius_km: float | None,
        already: int,
        limit: int,
    ) -> list[RawCompany]:
        """Fetch further result pages via /maps/api/search (best effort)."""
        csrf = (state.get("config") or {}).get("csrfToken")
        if not csrf:
            m = _CSRF_RE.search(html_text)
            csrf = m.group(1) if m else None
        sm = _SESSION_RE.search(html_text)
        session_id = sm.group(1) if sm else None
        if not csrf or not session_id:
            return []

        api = f"{self._origin()}/maps/api/search"
        base_params: dict[str, str | int] = {
            "ajax": 1, "sessionId": session_id, "text": text,
            "type": "biz", "lang": "ru_RU", "results": 50,
        }
        if center:
            lat, lng = center
            base_params["ll"] = f"{lng},{lat}"
            d = km_to_deg(radius_km or 15)
            base_params["spn"] = f"{d},{d}"

        collected: list[RawCompany] = []
        page = 1
        skip = already
        while already + len(collected) < limit and page <= settings.YANDEX_SCRAPER_MAX_PAGES:
            await asyncio.sleep(settings.YANDEX_SCRAPER_DELAY)
            payload = await self._api_call(client, api, {**base_params, "skip": skip, "csrfToken": csrf})
            if payload is None:
                break
            # Token rotation handshake: the endpoint may reply with a fresh token.
            if set(payload.keys()) == {"csrfToken"}:
                csrf = payload["csrfToken"]
                payload = await self._api_call(client, api, {**base_params, "skip": skip, "csrfToken": csrf})
                if payload is None:
                    break
            items = _items_from_api(payload)
            if not items:
                break
            mapped = [
                c for c in (
                    _item_to_company(it, self.source, None, None) for it in items
                ) if c is not None
            ]
            if not mapped:
                break
            collected.extend(mapped)
            skip += len(items)
            page += 1
        return collected

    async def _api_call(self, client: httpx.AsyncClient, url: str, params: dict) -> dict | None:
        headers = {"X-Requested-With": "XMLHttpRequest", "Accept": "application/json"}
        try:
            r = await client.get(url, params=params, headers=headers)
        except httpx.HTTPError:
            return None
        if r.status_code != 200:
            return None
        try:
            return r.json()
        except ValueError:
            return None

    @staticmethod
    def _dedupe(companies: list[RawCompany]) -> list[RawCompany]:
        seen: set = set()
        unique: list[RawCompany] = []
        for c in companies:
            key = c.external_id or (c.name, round(c.lat or 0, 5), round(c.lng or 0, 5))
            if key in seen:
                continue
            seen.add(key)
            unique.append(c)
        return unique


parser = YandexMapsParser()
