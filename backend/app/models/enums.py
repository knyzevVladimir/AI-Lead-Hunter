"""Domain enumerations shared across models and schemas."""
from enum import Enum


class Source(str, Enum):
    google_maps = "google_maps"
    yandex_maps = "yandex_maps"
    twogis = "2gis"
    osm = "openstreetmap"
    bing_maps = "bing_maps"
    manual = "manual"


class WebsiteStatus(str, Enum):
    ok = "ok"          # site exists and reachable
    none = "none"      # no website at all
    broken = "broken"  # site exists but returns errors
    unreachable = "unreachable"  # timeout / DNS failure


class CRMStatus(str, Enum):
    new = "new"                    # Новый
    analyzed = "analyzed"          # Проанализирован
    email_sent = "email_sent"      # Отправлено письмо
    replied = "replied"            # Ответил
    negotiation = "negotiation"    # Переговоры
    client = "client"              # Клиент
    rejected = "rejected"          # Отказ
    blacklist = "blacklist"        # Черный список


class Channel(str, Enum):
    email = "email"
    telegram = "telegram"
    whatsapp = "whatsapp"
    sms = "sms"
    linkedin = "linkedin"


class MessageStatus(str, Enum):
    draft = "draft"
    queued = "queued"
    sent = "sent"
    replied = "replied"
    failed = "failed"


class ServiceType(str, Enum):
    website = "website"            # создание сайта
    redesign = "redesign"          # редизайн
    seo = "seo"                    # SEO
    ads = "ads"                    # контекстная реклама
    crm = "crm"                    # CRM
    chatbot = "chatbot"            # чат-бот
    automation = "automation"      # автоматизация
    online_booking = "online_booking"  # онлайн-запись
    whatsapp = "whatsapp"          # интеграция WhatsApp
    ai_assistant = "ai_assistant"  # AI-консультант
    analytics = "analytics"        # настройка аналитики
