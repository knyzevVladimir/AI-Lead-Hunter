"""Integration endpoints: status, email sending, and CRM/export push."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.integrations.crm.providers import crm_status, push_lead
from app.integrations.email.providers import email_status, send_email
from app.models import Company, Message, StatusHistory
from app.models.enums import CRMStatus, MessageStatus
from app.services.parser.registry import provider_configured

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ---------- Status ----------
@router.get("/status")
async def integrations_status():
    return {
        "search": {
            "openstreetmap": True,
            "google_maps": provider_configured("google_maps"),
            "yandex_maps": provider_configured("yandex_maps"),
            "2gis": provider_configured("2gis"),
        },
        "email": email_status(),
        "crm_export": crm_status(),
    }


# ---------- Send email ----------
class SendRequest(BaseModel):
    message_id: int | None = None
    company_id: int | None = None
    provider: str | None = None
    subject: str | None = None
    body: str | None = None


@router.post("/send")
async def send(req: SendRequest, db: AsyncSession = Depends(get_db)):
    message: Message | None = None
    company: Company | None = None

    if req.message_id:
        res = await db.execute(select(Message).where(Message.id == req.message_id))
        message = res.scalar_one_or_none()
        if not message:
            raise HTTPException(404, "Message not found")
        company = await db.get(Company, message.company_id)
    elif req.company_id:
        company = await db.get(Company, req.company_id)
    else:
        raise HTTPException(400, "Provide message_id or company_id")

    if not company:
        raise HTTPException(404, "Company not found")
    if not company.email:
        raise HTTPException(422, "Company has no email address")

    subject = req.subject or (message.subject if message else None) or "Предложение"
    body = req.body or (message.body if message else None)
    if not body:
        raise HTTPException(422, "No message body to send")

    try:
        result = await send_email(company.email, subject, body, provider=req.provider)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Send failed: {e}")

    # Update message + company state
    now = datetime.now(timezone.utc)
    if message:
        message.status = MessageStatus.sent.value
        message.sent_at = now
    if company.status in (CRMStatus.new.value, CRMStatus.analyzed.value):
        old = company.status
        company.status = CRMStatus.email_sent.value
        db.add(StatusHistory(company_id=company.id, old_status=old, new_status=company.status, note="Письмо отправлено"))
    await db.commit()
    return {"ok": True, "result": result}


# ---------- Export / push to CRM ----------
class ExportRequest(BaseModel):
    target: str  # hubspot | amocrm | bitrix24 | notion | google_sheets
    company_ids: list[int] | None = None
    has_email: bool = False
    no_website: bool = False
    min_score: int | None = None
    limit: int = 100


@router.post("/export")
async def export(req: ExportRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Company).options(selectinload(Company.analysis))
    if req.company_ids:
        stmt = stmt.where(Company.id.in_(req.company_ids))
    else:
        if req.has_email:
            stmt = stmt.where(Company.email.is_not(None))
        if req.no_website:
            stmt = stmt.where(Company.website.is_(None))
        if req.min_score is not None:
            stmt = stmt.where(Company.ai_score >= req.min_score)
        stmt = stmt.order_by(Company.ai_score.desc().nullslast()).limit(req.limit)

    res = await db.execute(stmt)
    companies = list(res.scalars().all())

    pushed, failed, errors = 0, 0, []
    for c in companies:
        lead = {
            "name": c.name,
            "company": c.name,
            "phone": c.phone,
            "email": c.email,
            "website": c.website,
            "category": c.category,
            "city": c.city,
            "ai_score": c.ai_score,
            "note": c.analysis.summary if c.analysis else "",
        }
        try:
            await push_lead(req.target, lead)
            pushed += 1
        except Exception as e:  # noqa: BLE001
            failed += 1
            if len(errors) < 5:
                errors.append(f"{c.name}: {e}")

    return {"target": req.target, "total": len(companies), "pushed": pushed, "failed": failed, "errors": errors}
