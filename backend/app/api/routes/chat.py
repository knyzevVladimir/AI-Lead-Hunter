"""AI Chat — natural language queries over the leads database."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Company
from app.schemas.schemas import ChatRequest, ChatResponse, CompanyOut
from app.services.aichat.nlu import describe_filters, parse_query
from app.services.parser.osm import osm_category_values

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    f = parse_query(req.message)

    stmt = select(Company).options(selectinload(Company.analysis))
    if f["category"]:
        osm_vals = osm_category_values(f["category"])
        if osm_vals:
            stmt = stmt.where(Company.category.in_(osm_vals))
        else:
            stmt = stmt.where(Company.category.ilike(f"%{f['category']}%"))
    if f["city"]:
        stmt = stmt.where(Company.city.ilike(f"%{f['city']}%"))
    if f["has_email"]:
        stmt = stmt.where(Company.email.is_not(None))
    if f["no_website"]:
        stmt = stmt.where(Company.website.is_(None))
    if f["low_rating"]:
        stmt = stmt.where(Company.rating < 4.0)
    if f["few_reviews"]:
        stmt = stmt.where((Company.reviews_count < 30) | (Company.reviews_count.is_(None)))

    if f["sort_by_score"]:
        stmt = stmt.order_by(Company.ai_score.desc().nullslast())
    else:
        stmt = stmt.order_by(Company.created_at.desc())

    res = await db.execute(stmt)
    companies = list(res.scalars().all())

    # JSON-based post filters
    if f["no_socials"]:
        companies = [c for c in companies if not c.socials]
    if f["no_https"]:
        companies = [c for c in companies if not (c.analysis and c.analysis.website_checks.get("https"))]
    if f["no_booking"]:
        companies = [c for c in companies if not (c.analysis and c.analysis.website_checks.get("online_booking"))]

    total = len(companies)
    top = companies[:50]
    summary = describe_filters(f)
    reply = f"Понял запрос ({summary}). Нашёл {total} компаний."
    if total == 0:
        reply += " Попробуйте сначала выполнить поиск на вкладке «Поиск»."

    return ChatResponse(
        reply=reply,
        parsed_filters=f,
        results=[CompanyOut.model_validate(c) for c in top],
        total=total,
    )
