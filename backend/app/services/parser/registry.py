"""Search-provider registry: maps a `source` to a parser implementation."""
from __future__ import annotations

from app.core.config import settings
from app.models.enums import Source
from app.services.parser.google import GooglePlacesParser
from app.services.parser.osm import parser as osm_parser
from app.services.parser.twogis import TwoGISParser
from app.services.parser.yandex import YandexMapsParser

_PROVIDERS = {
    Source.osm.value: osm_parser,
    Source.google_maps.value: GooglePlacesParser(),
    Source.yandex_maps.value: YandexMapsParser(),
    Source.twogis.value: TwoGISParser(),
}


def get_parser(source: str):
    """Return a parser instance for the given source (defaults to OSM)."""
    return _PROVIDERS.get(source, osm_parser)


def provider_configured(source: str) -> bool:
    """Whether the given provider has the credentials it needs.

    OSM and Yandex.Maps are key-free (Yandex is scraped from the public web),
    so they are always considered configured. Google and 2GIS still need keys.
    """
    if source == Source.google_maps.value:
        return bool(settings.GOOGLE_MAPS_API_KEY)
    if source == Source.twogis.value:
        return bool(settings.TWOGIS_API_KEY)
    return True  # OSM + Yandex.Maps need no key
