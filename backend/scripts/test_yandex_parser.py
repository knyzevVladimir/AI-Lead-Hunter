"""Tests for the key-free Yandex Maps parser.

Offline assertions run against a synthetic SERP state that mirrors the real
shape Yandex embeds in the page (so they pass without network access). Pass
``--live`` to additionally hit the real Yandex Maps SERP and print results.

    python -m scripts.test_yandex_parser          # offline unit checks
    python -m scripts.test_yandex_parser --live    # + real network call
"""
from __future__ import annotations

import asyncio
import json
import sys

from app.services.parser.yandex import (
    YandexMapsParser,
    _clean_website,
    _extract_state,
    _items_from_state,
    _item_to_company,
)

# A trimmed but realistic slice of a Yandex Maps SERP "state-view" payload.
SAMPLE_ITEM = {
    "title": "Топган",
    "categories": [
        {"id": "1", "name": "Барбершоп", "class": "hairdressers", "seoname": "barber_shop"},
        {"id": "2", "name": "парикмахерская", "class": "hairdressers"},
    ],
    "address": "ул. Земляной Вал, 12/7с1",
    "fullAddress": "Москва, улица Земляной Вал, 12/7с1",
    "coordinates": [37.656383, 55.761624],
    "phones": [{"number": "+7 (903) 524-64-44", "type": "phone", "value": "+79035246444"}],
    "urls": ["https://топган.рф/курская?yclid=1234&utm_source=geoadv_maps&page=barbers"],
    "socialLinks": [
        {"type": "youtube", "href": "https://www.youtube.com/topgunbarbershop"},
        {"type": "whatsapp", "href": "https://wa.me/79035246444"},
        {"type": "vkontakte", "href": "https://vk.com/topgun"},
    ],
    "ratingData": {"ratingCount": 905, "ratingValue": 5, "reviewCount": 685},
    "workingTimeText": "ежедневно, 10:00–22:00",
    "id": 6934076174,
    "seoname": "topgan",
    "country": "Россия",
}


def _build_html(state: dict) -> str:
    """Wrap a state dict the way Yandex embeds it (HTML-escaped script tag)."""
    body = json.dumps(state, ensure_ascii=False).replace("&", "&amp;").replace("<", "&lt;")
    return (
        "<html><head></head><body>"
        f'<script class="state-view" type="application/json">{body}</script>'
        '<script>var sessionId="1785264852322306";var csrfToken="abc123def456:1785264878";</script>'
        "</body></html>"
    )


def check(cond: bool, label: str) -> None:
    print(("  PASS " if cond else "  FAIL ") + label)
    if not cond:
        raise AssertionError(label)


def test_offline() -> None:
    print("[offline] state extraction + item mapping")
    state = {"stack": [{"results": {"items": [SAMPLE_ITEM], "totalResultCount": 65}}]}
    html = _build_html(state)

    parsed = _extract_state(html)
    check(parsed is not None, "state-view JSON extracted from HTML")

    items = _items_from_state(parsed)
    check(len(items) == 1, "one organisation found in state")

    c = _item_to_company(items[0], "yandex_maps", "Москва", "Россия")
    check(c is not None, "item mapped to RawCompany")
    check(c.name == "Топган", "name mapped")
    check(c.category == "Барбершоп", "primary category mapped")
    check(c.address == "Москва, улица Земляной Вал, 12/7с1", "full address preferred")
    check(c.lat == 55.761624 and c.lng == 37.656383, "coordinates mapped [lng,lat]->lat,lng")
    check(c.phone == "+7 (903) 524-64-44", "phone (human-readable) mapped")
    check(c.rating == 5.0 and c.reviews_count == 685, "rating + review count mapped")
    check(c.opening_hours == "ежедневно, 10:00–22:00", "working hours mapped")
    check(c.external_id == "6934076174", "external id mapped")
    check("yclid" not in c.website and "utm_source" not in c.website, "tracking params stripped")
    check(c.website.endswith("?page=barbers"), "legit query params kept")
    check(c.socials.get("vk") == "https://vk.com/topgun", "vk social mapped")
    check("whatsapp" in c.socials and "youtube" in c.socials, "whatsapp + youtube socials mapped")

    print("[offline] edge cases")
    check(_extract_state("<html>no state here</html>") is None, "missing state -> None")
    check(_items_from_state({"stack": []}) == [], "empty stack -> []")
    check(_item_to_company({}, "yandex_maps", None, None) is None, "item without title -> None")
    check(_clean_website(None) is None, "None url -> None")
    check(_clean_website("https://x.ru/?utm_medium=cpc") == "https://x.ru/", "utm stripped, path kept")
    print("OFFLINE TESTS PASSED\n")


async def test_live() -> None:
    print("[live] hitting real Yandex Maps SERP (барбершоп, Москва)...")
    parser = YandexMapsParser()
    results = await parser.search("барбершоп", city="Москва", radius_km=15, limit=30)
    print(f"  got {len(results)} companies")
    for c in results[:5]:
        print(f"   • {c.name:<28} | {c.phone or '—':<20} | ⭐{c.rating or '—'} "
              f"({c.reviews_count or 0}) | {c.website or 'нет сайта'}")
    check(len(results) > 0, "live search returned at least one company")
    check(any(c.phone for c in results), "at least one company has a phone")
    print("LIVE TEST PASSED\n")


if __name__ == "__main__":
    test_offline()
    if "--live" in sys.argv:
        asyncio.run(test_live())
