"""Natural-language query understanding for the AI Chat.

Rule-based parser that turns free-form Russian/English commands into a
structured filter dict. Deterministic and key-free; an LLM layer can be added
later for fuzzier phrasing.
"""
from __future__ import annotations

import re

from app.services.parser.osm import CATEGORY_MAP

# City stems (nominative) → canonical name. Matches genitive/other forms by stem.
CITY_STEMS = {
    "москв": "Москва",
    "петербург": "Санкт-Петербург",
    "спб": "Санкт-Петербург",
    "прага": "Прага",
    "праг": "Прага",
    "берлин": "Берлин",
    "лондон": "Лондон",
    "париж": "Париж",
    "киев": "Киев",
    "казан": "Казань",
    "новосибирск": "Новосибирск",
    "екатеринбург": "Екатеринбург",
}


def parse_query(message: str) -> dict:
    text = message.lower()
    filters: dict = {
        "category": None,
        "city": None,
        "no_website": False,
        "has_email": False,
        "no_https": False,
        "no_socials": False,
        "low_rating": False,
        "few_reviews": False,
        "no_booking": False,
        "sort_by_score": False,
    }

    # Category
    for key in CATEGORY_MAP:
        if key in text:
            filters["category"] = key
            break

    # City by stem
    for stem, canonical in CITY_STEMS.items():
        if stem in text:
            filters["city"] = canonical
            break

    # Flags
    if re.search(r"без сайта|нет сайта|no website|without (a )?website", text):
        filters["no_website"] = True
    if re.search(r"с email|есть email|with email|c почтой|с почтой", text):
        filters["has_email"] = True
    if re.search(r"без https|нет https|no https|без ssl|нет ssl", text):
        filters["no_https"] = True
    if re.search(r"без соцсет|нет соцсет|no social", text):
        filters["no_socials"] = True
    if re.search(r"рейтинг(ом)? (ниже|меньше|<) ?4|низк\w* рейтинг|low rating", text):
        filters["low_rating"] = True
    if re.search(r"мало отзыв|меньше 30 отзыв|few reviews|< ?30", text):
        filters["few_reviews"] = True
    if re.search(r"без онлайн-запис|нет онлайн-запис|no (online )?booking", text):
        filters["no_booking"] = True
    if re.search(r"сортир|отсортируй|по вероятност|по перспектив|sort|most promising|перспектив", text):
        filters["sort_by_score"] = True

    return filters


def describe_filters(f: dict) -> str:
    """Human-readable summary of what the parser understood."""
    parts: list[str] = []
    if f.get("category"):
        parts.append(f"категория: {f['category']}")
    if f.get("city"):
        parts.append(f"город: {f['city']}")
    if f.get("no_website"):
        parts.append("без сайта")
    if f.get("has_email"):
        parts.append("с email")
    if f.get("no_https"):
        parts.append("без HTTPS")
    if f.get("no_socials"):
        parts.append("без соцсетей")
    if f.get("low_rating"):
        parts.append("рейтинг < 4")
    if f.get("few_reviews"):
        parts.append("мало отзывов")
    if f.get("no_booking"):
        parts.append("без онлайн-записи")
    if f.get("sort_by_score"):
        parts.append("сортировка по AI Score")
    return "; ".join(parts) or "без фильтров"
