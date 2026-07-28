"""Dashboard statistics."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Company, Message
from app.models.enums import Channel, MessageStatus
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/stats", tags=["stats"])


async def _count(db: AsyncSession, stmt) -> int:
    res = await db.execute(stmt)
    return int(res.scalar_one() or 0)


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(db: AsyncSession = Depends(get_db)):
    companies_found = await _count(db, select(func.count(Company.id)))
    without_website = await _count(db, select(func.count(Company.id)).where(Company.website.is_(None)))
    with_email = await _count(db, select(func.count(Company.id)).where(Company.email.is_not(None)))
    very_promising = await _count(db, select(func.count(Company.id)).where(Company.ai_score >= 80))
    emails_sent = await _count(
        db,
        select(func.count(Message.id)).where(
            Message.channel == Channel.email.value, Message.status == MessageStatus.sent.value
        ),
    )
    replies = await _count(
        db, select(func.count(Message.id)).where(Message.status == MessageStatus.replied.value)
    )
    conversion = round((replies / emails_sent * 100), 1) if emails_sent else 0.0

    return DashboardStats(
        companies_found=companies_found,
        without_website=without_website,
        with_email=with_email,
        very_promising=very_promising,
        emails_sent=emails_sent,
        replies=replies,
        conversion=conversion,
    )
