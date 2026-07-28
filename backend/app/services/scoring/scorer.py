"""AI Score engine.

Computes a 0-100 "opportunity score": HIGHER means a more promising prospect
for a web/marketing agency (i.e. the business has more gaps to sell against).
Also derives concrete recommended services, Google Business issues and a
social-presence summary.
"""
from __future__ import annotations

from app.models.enums import ServiceType, WebsiteStatus

# Each rule: (points, human-readable reason). Points sum then clamp to 100.
def compute_score(
    *,
    website_status: str,
    checks: dict,
    rating: float | None,
    reviews_count: int | None,
    socials: dict | None,
) -> dict:
    socials = socials or {}
    breakdown: dict[str, int] = {}
    services: set[str] = set()
    reasons: list[str] = []

    no_site = website_status in (WebsiteStatus.none.value, WebsiteStatus.broken.value, WebsiteStatus.unreachable.value)

    if website_status == WebsiteStatus.none.value:
        breakdown["Нет сайта"] = 35
        reasons.append("нет собственного сайта")
        services.update([ServiceType.website.value, ServiceType.online_booking.value])
    elif website_status in (WebsiteStatus.broken.value, WebsiteStatus.unreachable.value):
        breakdown["Сайт не работает"] = 30
        reasons.append("сайт недоступен или сломан")
        services.update([ServiceType.website.value, ServiceType.redesign.value])
    else:
        # Site exists — score quality gaps
        if not checks.get("https"):
            breakdown["Нет HTTPS/SSL"] = 8
            reasons.append("нет защищённого соединения (HTTPS)")
            services.add(ServiceType.website.value)
        if not checks.get("mobile_friendly"):
            breakdown["Нет мобильной версии"] = 9
            reasons.append("сайт не адаптирован под мобильные")
            services.add(ServiceType.redesign.value)
        if not checks.get("modern_design"):
            breakdown["Устаревший дизайн"] = 7
            reasons.append("устаревший дизайн")
            services.add(ServiceType.redesign.value)
        if not checks.get("seo"):
            breakdown["Слабое SEO"] = 8
            reasons.append("не настроено SEO")
            services.add(ServiceType.seo.value)
        if not checks.get("sitemap_xml"):
            breakdown["Нет sitemap.xml"] = 3
            services.add(ServiceType.seo.value)
        if not checks.get("robots_txt"):
            breakdown["Нет robots.txt"] = 2
            services.add(ServiceType.seo.value)
        if not checks.get("online_booking"):
            breakdown["Нет онлайн-записи"] = 7
            reasons.append("нет онлайн-записи")
            services.update([ServiceType.online_booking.value, ServiceType.whatsapp.value])
        if not checks.get("contact_form"):
            breakdown["Нет формы связи"] = 4
            services.add(ServiceType.website.value)
        load_ms = checks.get("load_ms")
        if isinstance(load_ms, int) and load_ms > 3000:
            breakdown["Медленная загрузка"] = 5
            reasons.append("медленная загрузка сайта")
            services.add(ServiceType.redesign.value)

    # Reputation signals (apply regardless of website)
    if reviews_count is None or reviews_count < 30:
        breakdown["Мало отзывов"] = 6
        reasons.append("мало отзывов")
        services.add(ServiceType.ads.value)
    if rating is not None and rating < 4.0:
        breakdown["Низкий рейтинг"] = 6
        reasons.append("низкий рейтинг")
        services.add(ServiceType.analytics.value)

    # Social presence
    if not socials:
        breakdown["Нет соцсетей"] = 5
        reasons.append("нет ссылок на соцсети")
        services.add(ServiceType.ads.value)

    # Cross-sell staples for high-gap prospects
    if no_site:
        services.update([ServiceType.crm.value, ServiceType.chatbot.value, ServiceType.ai_assistant.value])

    score = min(100, sum(breakdown.values()))

    return {
        "ai_score": score,
        "score_breakdown": breakdown,
        "possible_services": sorted(services),
        "reasons": reasons,
    }


def google_business_issues(rating: float | None, reviews_count: int | None) -> list[str]:
    """Detectable Google Business Profile issues from available data."""
    issues: list[str] = []
    if reviews_count is None or reviews_count < 10:
        issues.append("Мало отзывов")
    if rating is not None and rating < 4.0:
        issues.append("Низкий рейтинг")
    return issues


def social_summary(socials: dict | None) -> dict:
    """Structured summary of social presence from known links."""
    socials = socials or {}
    networks = ["instagram", "facebook", "vk", "telegram", "tiktok", "linkedin"]
    return {net: {"found": net in socials, "url": socials.get(net)} for net in networks}
