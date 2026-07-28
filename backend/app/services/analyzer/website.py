"""Real website analyzer.

Given a URL, performs live HTTP checks and returns a structured quality report.
No API keys required — this genuinely inspects the site.
"""
from __future__ import annotations

import time
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.models.enums import WebsiteStatus

BOOKING_KEYWORDS = [
    "онлайн-запись", "онлайн запись", "записаться", "запись онлайн", "забронировать",
    "book now", "book online", "booking", "appointment", "reserve", "schedule",
]


def _normalize_url(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        return "https://" + url
    return url


async def analyze_website(url: str | None) -> dict:
    """Analyze a website URL. Returns {status, checks{...}}."""
    checks: dict = {
        "https": False,
        "mobile_friendly": False,
        "load_ms": None,
        "modern_design": False,
        "online_booking": False,
        "contact_form": False,
        "has_map": False,
        "favicon": False,
        "title": None,
        "meta_description": False,
        "h1": False,
        "seo": False,
        "robots_txt": False,
        "sitemap_xml": False,
    }

    if not url:
        return {"status": WebsiteStatus.none.value, "checks": checks}

    target = _normalize_url(url)
    parsed = urlparse(target)
    base = f"{parsed.scheme}://{parsed.netloc}"

    timeout = httpx.Timeout(settings.ANALYZER_TIMEOUT)
    headers = {"User-Agent": settings.USER_AGENT}

    try:
        async with httpx.AsyncClient(
            timeout=timeout, headers=headers, follow_redirects=True, verify=False
        ) as client:
            start = time.perf_counter()
            try:
                resp = await client.get(target)
            except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout):
                return {"status": WebsiteStatus.unreachable.value, "checks": checks}

            checks["load_ms"] = int((time.perf_counter() - start) * 1000)

            if resp.status_code >= 400:
                return {"status": WebsiteStatus.broken.value, "checks": checks}

            final_url = str(resp.url)
            checks["https"] = final_url.startswith("https://")

            html = resp.text
            soup = BeautifulSoup(html, "lxml")
            text_lower = html.lower()

            # Mobile viewport
            viewport = soup.find("meta", attrs={"name": "viewport"})
            checks["mobile_friendly"] = viewport is not None

            # Favicon
            checks["favicon"] = bool(
                soup.find("link", rel=lambda v: v and "icon" in v.lower())
            )

            # SEO basics
            title_tag = soup.find("title")
            checks["title"] = title_tag.get_text(strip=True) if title_tag else None
            checks["meta_description"] = bool(
                soup.find("meta", attrs={"name": "description"})
            )
            checks["h1"] = bool(soup.find("h1"))
            checks["seo"] = bool(checks["title"]) and checks["meta_description"] and checks["h1"]

            # Contact form
            has_form = bool(soup.find("form"))
            has_mailto = "mailto:" in text_lower
            checks["contact_form"] = has_form or has_mailto

            # Online booking
            checks["online_booking"] = any(k in text_lower for k in BOOKING_KEYWORDS)

            # Map embed
            checks["has_map"] = any(
                s in text_lower
                for s in ["maps.google", "yandex.ru/map", "api-maps.yandex", "2gis", "openstreetmap", "leaflet"]
            )

            # Modern design heuristic: responsive + uses a modern stack / CSS
            modern_signals = [
                checks["mobile_friendly"],
                "flex" in text_lower or "grid" in text_lower,
                any(f in text_lower for f in ["tailwind", "bootstrap", "react", "vue", "next", "wp-content/themes"]),
            ]
            checks["modern_design"] = sum(bool(s) for s in modern_signals) >= 2

            # robots.txt & sitemap.xml
            try:
                rob = await client.get(urljoin(base, "/robots.txt"))
                checks["robots_txt"] = rob.status_code == 200 and "user-agent" in rob.text.lower()
            except httpx.HTTPError:
                pass
            try:
                sm = await client.get(urljoin(base, "/sitemap.xml"))
                checks["sitemap_xml"] = sm.status_code == 200 and "<urlset" in sm.text.lower() or "<sitemapindex" in (sm.text.lower() if sm.status_code == 200 else "")
            except httpx.HTTPError:
                pass

            return {"status": WebsiteStatus.ok.value, "checks": checks}

    except httpx.HTTPError:
        return {"status": WebsiteStatus.unreachable.value, "checks": checks}
