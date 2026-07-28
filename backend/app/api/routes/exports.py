"""Export leads to CSV (Excel/Sheets/CRM-compatible)."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Company

router = APIRouter(prefix="/export", tags=["export"])

COLUMNS = [
    "id", "name", "category", "city", "country", "address", "phone", "email",
    "website", "rating", "reviews_count", "ai_score", "status", "website_status",
    "possible_services", "lat", "lng",
]


@router.get("/csv")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    has_email: bool = False,
    no_website: bool = False,
    min_score: int | None = None,
):
    stmt = select(Company).options(selectinload(Company.analysis))
    if has_email:
        stmt = stmt.where(Company.email.is_not(None))
    if no_website:
        stmt = stmt.where(Company.website.is_(None))
    if min_score is not None:
        stmt = stmt.where(Company.ai_score >= min_score)
    stmt = stmt.order_by(Company.ai_score.desc().nullslast())

    res = await db.execute(stmt)
    companies = res.scalars().all()

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for c in companies:
        writer.writerow(
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "city": c.city,
                "country": c.country,
                "address": c.address,
                "phone": c.phone,
                "email": c.email,
                "website": c.website,
                "rating": c.rating,
                "reviews_count": c.reviews_count,
                "ai_score": c.ai_score,
                "status": c.status,
                "website_status": c.analysis.website_status if c.analysis else "",
                "possible_services": ",".join(c.analysis.possible_services) if c.analysis else "",
                "lat": c.lat,
                "lng": c.lng,
            }
        )
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )
