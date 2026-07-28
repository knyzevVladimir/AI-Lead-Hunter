"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "AI Lead Hunter"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"
    SECRET_KEY: str = "change-me-in-production"

    # Database — defaults to local SQLite so the app runs with zero setup.
    # In docker-compose this is overridden with the async Postgres DSN.
    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_lead_hunter.db"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # External data sources
    OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    NOMINATIM_URL: str = "https://nominatim.openstreetmap.org"
    USER_AGENT: str = "AILeadHunter/1.0 (+https://github.com/ai-lead-hunter)"

    # Yandex Maps — KEY-FREE web scraper (no YANDEX_MAPS_API_KEY needed).
    # Reads the public Yandex Maps SERP and parses the JSON that Yandex embeds
    # in the page. A browser-like User-Agent is required for the SERP host.
    YANDEX_MAPS_BASE_URL: str = "https://yandex.ru/maps/"
    YANDEX_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    )
    YANDEX_SCRAPER_TIMEOUT: float = 30.0
    YANDEX_SCRAPER_MAX_PAGES: int = 4        # best-effort extra pages via internal API
    YANDEX_SCRAPER_DELAY: float = 1.2        # polite pause between paginated calls (s)
    # If the Yandex scraper is blocked (captcha) or returns nothing, transparently
    # fall back to the always-available, key-free OpenStreetMap provider.
    YANDEX_SEARCH_FALLBACK_OSM: bool = True

    # Optional map providers (used only if a key is provided)
    GOOGLE_MAPS_API_KEY: str = ""
    YANDEX_MAPS_API_KEY: str = ""  # deprecated / unused — Yandex now works key-free
    TWOGIS_API_KEY: str = ""

    # LLM — offer generation & AI chat fall back to templates/rules when empty
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = ""  # set for Ollama/vLLM compatible endpoints

    # Website analyzer
    ANALYZER_TIMEOUT: float = 12.0
    ANALYZER_MAX_CONCURRENCY: int = 8

    # ---- Email sending ----
    DEFAULT_EMAIL_PROVIDER: str = "smtp"  # smtp | gmail | outlook
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_USE_SSL: bool = False  # True for port 465

    # Gmail API (OAuth2 refresh flow)
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REFRESH_TOKEN: str = ""
    GMAIL_FROM: str = ""

    # Microsoft Graph (Outlook)
    MS_TENANT_ID: str = ""
    MS_CLIENT_ID: str = ""
    MS_CLIENT_SECRET: str = ""
    MS_REFRESH_TOKEN: str = ""      # for delegated /me
    MS_SENDER: str = ""             # user id/email for app-only /users/{id}
    MS_APP_ONLY: bool = False       # True -> client_credentials + /users/{sender}

    # ---- CRM / Export ----
    HUBSPOT_TOKEN: str = ""
    AMOCRM_SUBDOMAIN: str = ""
    AMOCRM_ACCESS_TOKEN: str = ""
    BITRIX24_WEBHOOK_URL: str = ""  # https://portal.bitrix24.ru/rest/1/xxxx/
    NOTION_TOKEN: str = ""
    NOTION_DATABASE_ID: str = ""

    # Shared Google OAuth (Sheets)
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    GOOGLE_REFRESH_TOKEN: str = ""
    GOOGLE_SHEETS_SPREADSHEET_ID: str = ""
    GOOGLE_SHEETS_RANGE: str = "Leads!A1"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
