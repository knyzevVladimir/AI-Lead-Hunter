"""Celery tasks. Async service code is bridged with asyncio.run."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models import ChangeHistory, Company, Message
from app.models.enums import MessageStatus
from app.services.analyzer.website import analyze_website
from app.services.pipeline import analyze_company, search_and_ingest
from app.workers.celery_app import celery_app


def _run(coro):
    return asyncio.run(coro)


@celery_app.task(name="app.workers.tasks.search_task")
def search_task(query: str, city: str | None = None, radius_km: float | None = None, limit: int = 50):
    async def _job():
        async with AsyncSessionLocal() as db:
            found, ids = await search_and_ingest(db, query=query, city=city, radius_km=radius_km, limit=limit)
            return {"found": found, "saved": len(ids), "ids": ids}

    return _run(_job())


@celery_app.task(name="app.workers.tasks.analyze_company_task")
def analyze_company_task(company_id: int):
    async def _job():
        async with AsyncSessionLocal() as db:
            res = await db.execute(
                select(Company).options(selectinload(Company.analysis)).where(Company.id == company_id)
            )
            company = res.scalar_one_or_none()
            if not company:
                return {"error": "not found"}
            analysis = await analyze_company(db, company)
            return {"company_id": company_id, "ai_score": analysis.ai_score}

    return _run(_job())


@celery_app.task(name="app.workers.tasks.analyze_batch_task")
def analyze_batch_task(limit: int = 200):
    async def _job():
        async with AsyncSessionLocal() as db:
            res = await db.execute(
                select(Company).options(selectinload(Company.analysis)).limit(limit)
            )
            companies = list(res.scalars().all())
            done = 0
            for company in companies:
                await analyze_company(db, company)
                done += 1
            return {"analyzed": done}

    return _run(_job())


@celery_app.task(name="app.workers.tasks.monitor_companies")
def monitor_companies():
    """Re-check monitored companies and log any observed changes."""
    async def _job():
        async with AsyncSessionLocal() as db:
            res = await db.execute(
                select(Company).options(selectinload(Company.analysis)).where(Company.monitored.is_(True))
            )
            companies = list(res.scalars().all())
            changes = 0
            for company in companies:
                web = await analyze_website(company.website)
                prev = company.analysis.website_status if company.analysis else None
                if prev and web["status"] != prev:
                    db.add(
                        ChangeHistory(
                            company_id=company.id,
                            field="website",
                            old_value=str(prev),
                            new_value=str(web["status"]),
                            note="Изменился статус сайта",
                        )
                    )
                    changes += 1
                company.last_checked_at = datetime.now(timezone.utc)
            await db.commit()
            return {"monitored": len(companies), "changes": changes}

    return _run(_job())


@celery_app.task(name="app.workers.tasks.generate_followups")
def generate_followups():
    """Create AI follow-up drafts for messages sent 3 or 7 days ago with no reply."""
    async def _job():
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            res = await db.execute(
                select(Message).where(Message.status == MessageStatus.sent.value)
            )
            created = 0
            for msg in res.scalars().all():
                if not msg.sent_at:
                    continue
                age_days = (now - msg.sent_at).days
                next_step = None
                if age_days >= 7 and msg.followup_step < 2:
                    next_step = 2
                elif age_days >= 3 and msg.followup_step < 1:
                    next_step = 1
                if next_step:
                    db.add(
                        Message(
                            campaign_id=msg.campaign_id,
                            company_id=msg.company_id,
                            channel=msg.channel,
                            subject=(msg.subject or "") + " (напоминание)",
                            body="Здравствуйте! Напоминаем о нашем предложении — будем рады ответить на вопросы.",
                            status=MessageStatus.draft.value,
                            followup_step=next_step,
                        )
                    )
                    created += 1
            await db.commit()
            return {"followups_created": created}

    return _run(_job())
