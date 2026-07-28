"""Orchestration pipeline: search -> ingest -> analyze -> score."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Analysis, Company
from app.models.enums import CRMStatus, Source
from app.services.analyzer.website import analyze_website
from app.services.parser.osm import RawCompany
from app.services.parser.registry import get_parser
from app.services.scoring.scorer import compute_score, google_business_issues, social_summary


async def ingest_raw(db: AsyncSession, raw_list: list[RawCompany]) -> list[int]:
    """Upsert raw companies by (source, external_id). Returns saved ids."""
    ids: list[int] = []
    for raw in raw_list:
        existing = None
        if raw.external_id:
            res = await db.execute(
                select(Company).where(
                    Company.source == raw.source, Company.external_id == raw.external_id
                )
            )
            existing = res.scalar_one_or_none()

        if existing:
            company = existing
        else:
            company = Company(source=raw.source, external_id=raw.external_id)
            db.add(company)

        company.name = raw.name
        company.category = raw.category
        company.address = raw.address
        company.city = raw.city
        company.country = raw.country
        company.region = getattr(raw, "region", None)
        company.lat = raw.lat
        company.lng = raw.lng
        company.phone = raw.phone
        company.email = raw.email
        company.website = raw.website
        company.socials = raw.socials or {}
        if raw.rating is not None:
            company.rating = raw.rating
        if raw.reviews_count is not None:
            company.reviews_count = raw.reviews_count
        company.opening_hours = raw.opening_hours
        company.description = raw.description
        await db.flush()
        ids.append(company.id)
    await db.commit()
    return ids


async def search_and_ingest(
    db: AsyncSession,
    query: str,
    city: str | None = None,
    country: str | None = None,
    region: str | None = None,
    radius_km: float | None = None,
    limit: int = 50,
    source: str = Source.yandex_maps.value,
) -> tuple[int, list[int]]:
    """Run the selected provider, ingest results, and return (found, saved_ids).

    Yandex.Maps is the key-free default. If it is blocked (captcha) or returns
    nothing, we transparently fall back to OpenStreetMap so search keeps working
    with zero configuration.
    """
    kwargs = dict(
        query=query, city=city, country=country, region=region,
        radius_km=radius_km, limit=limit,
    )
    use_fallback = source == Source.yandex_maps.value and settings.YANDEX_SEARCH_FALLBACK_OSM

    try:
        raw = await get_parser(source).search(**kwargs)
    except Exception:  # noqa: BLE001
        if not use_fallback:
            raise
        raw = []

    if not raw and use_fallback:
        raw = await get_parser(Source.osm.value).search(**kwargs)

    ids = await ingest_raw(db, raw)
    return len(raw), ids


async def analyze_company(db: AsyncSession, company: Company) -> Analysis:
    """Run website analysis + scoring for a single company and persist it."""
    web = await analyze_website(company.website)
    score = compute_score(
        website_status=web["status"],
        checks=web["checks"],
        rating=company.rating,
        reviews_count=company.reviews_count,
        socials=company.socials,
    )

    # Build a short summary
    reasons = score["reasons"]
    if reasons:
        summary = f"AI Score {score['ai_score']}/100. Слабые места: " + ", ".join(reasons) + "."
    else:
        summary = f"AI Score {score['ai_score']}/100. Явных проблем не обнаружено."

    # Upsert analysis (1:1)
    if company.analysis:
        analysis = company.analysis
    else:
        analysis = Analysis(company_id=company.id)
        db.add(analysis)

    analysis.website_status = web["status"]
    analysis.website_checks = web["checks"]
    analysis.gbp_issues = google_business_issues(company.rating, company.reviews_count)
    analysis.social_analysis = social_summary(company.socials)
    analysis.ai_score = score["ai_score"]
    analysis.score_breakdown = score["score_breakdown"]
    analysis.possible_services = score["possible_services"]
    analysis.summary = summary

    # Reflect on company
    company.ai_score = score["ai_score"]
    company.last_checked_at = datetime.now(timezone.utc)
    if company.status == CRMStatus.new.value:
        company.status = CRMStatus.analyzed.value

    await db.commit()
    await db.refresh(analysis)
    return analysis
