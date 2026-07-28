"""Personalized commercial offer generator.

Falls back to a high-quality template when no LLM key is configured, and uses
an OpenAI-compatible endpoint (OpenAI / Ollama / vLLM) when available.
"""
from __future__ import annotations

from app.core.config import settings
from app.models.enums import Channel

SERVICE_LABELS = {
    "website": "создание современного сайта",
    "redesign": "редизайн сайта",
    "seo": "SEO-продвижение",
    "ads": "настройку рекламы",
    "crm": "внедрение CRM",
    "chatbot": "чат-бота",
    "automation": "автоматизацию процессов",
    "online_booking": "онлайн-запись",
    "whatsapp": "интеграцию WhatsApp",
    "ai_assistant": "AI-консультанта",
    "analytics": "настройку аналитики",
}


def _humanize_services(services: list[str]) -> str:
    labels = [SERVICE_LABELS.get(s, s) for s in services[:3]]
    if not labels:
        return "современный сайт с онлайн-записью"
    if len(labels) == 1:
        return labels[0]
    return ", ".join(labels[:-1]) + " и " + labels[-1]


def build_template_offer(company: dict, analysis: dict, tone: str = "professional") -> tuple[str | None, str]:
    """Return (subject, body) built from a template with company variables."""
    name = company.get("name", "вашей компании")
    category = company.get("category") or "бизнес"
    reasons = analysis.get("score_breakdown", {}) if analysis else {}
    services = analysis.get("possible_services", []) if analysis else []

    problem_line = ""
    if "Нет сайта" in reasons:
        problem_line = "Мы обратили внимание, что у вас пока нет собственного сайта."
    elif "Сайт не работает" in reasons:
        problem_line = "Мы заметили, что ваш сайт сейчас недоступен."
    elif "Нет мобильной версии" in reasons:
        problem_line = "Мы заметили, что ваш сайт не адаптирован под мобильные устройства."
    elif "Нет онлайн-записи" in reasons:
        problem_line = "Мы заметили, что на сайте нет удобной онлайн-записи."
    elif "Слабое SEO" in reasons:
        problem_line = "Мы заметили, что сайт слабо оптимизирован для поисковых систем."
    else:
        problem_line = "Мы посмотрели ваше присутствие в интернете и увидели точки роста."

    offer = _humanize_services(services)

    subject = f"Идея для {name}: {offer}"

    body = (
        f"Здравствуйте!\n\n"
        f"Мы посмотрели ваш {category} «{name}».\n"
        f"{problem_line}\n\n"
        f"Сегодня большинство клиентов ищут услуги онлайн, поэтому мы можем помочь с: {offer}. "
        f"Это обычно увеличивает поток заявок и упрощает работу с клиентами.\n\n"
        f"Будем рады обсудить детали и показать примеры.\n\n"
        f"С уважением,\nКоманда AI Lead Hunter"
    )
    if tone == "short":
        body = (
            f"Здравствуйте! Посмотрели «{name}». {problem_line} "
            f"Можем помочь с: {offer}. Удобно обсудить?"
        )
        subject = f"{name}: {offer}"
    return subject, body


async def generate_offer(company: dict, analysis: dict, channel: Channel, tone: str = "professional") -> dict:
    """Generate an offer, using an LLM if configured, else a template."""
    subject, body = build_template_offer(company, analysis, tone)
    used_llm = False

    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI

            client_kwargs = {"api_key": settings.OPENAI_API_KEY}
            if settings.OPENAI_BASE_URL:
                client_kwargs["base_url"] = settings.OPENAI_BASE_URL
            client = AsyncOpenAI(**client_kwargs)

            services = ", ".join(analysis.get("possible_services", [])) if analysis else ""
            reasons = ", ".join((analysis or {}).get("reasons", []) if analysis else [])
            prompt = (
                f"Business: {company.get('name')} ({company.get('category')}), city {company.get('city')}. "
                f"Detected problems: {reasons or 'general growth opportunities'}. "
                f"Recommended services: {services}. "
                f"Write a short, warm, non-spammy outreach {channel.value} in Russian offering help. "
                f"Tone: {tone}. Return the message body only, no preamble."
            )
            resp = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful B2B sales assistant writing concise, respectful outreach."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=400,
            )
            body = resp.choices[0].message.content.strip()
            used_llm = True
        except Exception:
            # Silently fall back to template on any LLM error
            used_llm = False

    return {"subject": subject if channel == Channel.email else None, "body": body, "used_llm": used_llm}
