"""Leads listing, detail, analysis and change history."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Analysis, ChangeHistory, Company
from app.models.enums import WebsiteStatus
from app.schemas.schemas import (
    AnalysisOut,
    ChangeHistoryOut,
    CompanyDetail,
    CompanyList,
    CompanyOut,
)
from app.services.pipeline import analyze_company

router = APIRouter(prefix="/leads", tags=["leads"])


def _passes_json_filters(company: Company, f: dict) -> bool:
    if f.get("no_socials") and company.socials:
        return False
    checks = company.analysis.website_checks if company.analysis else {}
    if f.get("no_https") and checks.get("https"):
        return False
    if f.get("no_booking") and checks.get("online_booking"):
        return False
    return True


@router.get("", response_model=CompanyList)
async def list_leads(
    db: AsyncSession = Depends(get_db),
    category: str | None = None,
    city: str | None = None,
    status: str | None = None,
    monitored: bool | None = None,
    min_score: int | None = Query(None, ge=0, le=100),
    no_website: bool = False,
    has_email: bool = False,
    no_socials: bool = False,
    low_rating: bool = False,
    few_reviews: bool = False,
    no_https: bool = False,
    no_booking: bool = False,
    sort_by_score: bool = True,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = select(Company).options(selectinload(Company.analysis))

    if category:
        stmt = stmt.where(Company.category.ilike(f"%{category}%"))
    if city:
        stmt = stmt.where(Company.city.ilike(f"%{city}%"))
    if status:
        stmt = stmt.where(Company.status == status)
    if monitored is not None:
        stmt = stmt.where(Company.monitored == monitored)
    if min_score is not None:
        stmt = stmt.where(Company.ai_score >= min_score)
    if has_email:
        stmt = stmt.where(Company.email.is_not(None))
    if no_website:
        stmt = stmt.where(Company.website.is_(None))
    if low_rating:
        stmt = stmt.where(Company.rating < 4.0)
    if few_reviews:
        stmt = stmt.where((Company.reviews_count < 30) | (Company.reviews_count.is_(None)))

    if sort_by_score:
        stmt = stmt.order_by(Company.ai_score.desc().nullslast())
    else:
        stmt = stmt.order_by(Company.created_at.desc())

    res = await db.execute(stmt)
    companies = list(res.scalars().all())

    f = {"no_socials": no_socials, "no_https": no_https, "no_booking": no_booking}
    if any(f.values()):
        companies = [c for c in companies if _passes_json_filters(c, f)]

    total = len(companies)
    page = companies[offset : offset + limit]
    return CompanyList(total=total, items=[CompanyOut.model_validate(c) for c in page])


@router.get("/{lead_id}", response_model=CompanyDetail)
async def get_lead(lead_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Company).options(selectinload(Company.analysis)).where(Company.id == lead_id)
    )
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Lead not found")
    return CompanyDetail.model_validate(company)


@router.post("/{lead_id}/analyze", response_model=AnalysisOut)
async def analyze_lead(lead_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Company).options(selectinload(Company.analysis)).where(Company.id == lead_id)
    )
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Lead not found")
    analysis = await analyze_company(db, company)
    return AnalysisOut.model_validate(analysis)


@router.post("/analyze-batch")
async def analyze_batch(
    limit: int = Query(50, ge=1, le=300),
    only_unanalyzed: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Analyze many companies at once (runs inline; use Celery in production)."""
    stmt = select(Company).options(selectinload(Company.analysis))
    if only_unanalyzed:
        stmt = stmt.where(Company.ai_score.is_(None))
    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    companies = list(res.scalars().all())
    analyzed = 0
    for company in companies:
        await analyze_company(db, company)
        analyzed += 1
    return {"analyzed": analyzed}


@router.get("/{lead_id}/history", response_model=list[ChangeHistoryOut])
async def lead_history(lead_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ChangeHistory)
        .where(ChangeHistory.company_id == lead_id)
        .order_by(ChangeHistory.created_at.desc())
    )
    return [ChangeHistoryOut.model_validate(h) for h in res.scalars().all()]


@router.post("/{lead_id}/monitor", response_model=CompanyOut)
async def toggle_monitor(lead_id: int, enabled: bool = True, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Company).options(selectinload(Company.analysis)).where(Company.id == lead_id)
    )
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Lead not found")
    company.monitored = enabled
    await db.commit()
    await db.refresh(company)
    return CompanyOut.model_validate(company)
