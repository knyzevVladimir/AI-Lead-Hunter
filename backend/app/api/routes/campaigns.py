"""Offer generation, campaigns and generated messages."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Campaign, Company, Message
from app.schemas.schemas import (
    CampaignCreate,
    CampaignOut,
    MessageOut,
    OfferRequest,
    OfferResponse,
)
from app.services.offer.generator import generate_offer

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("/offer", response_model=OfferResponse)
async def make_offer(req: OfferRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Company).options(selectinload(Company.analysis)).where(Company.id == req.company_id)
    )
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Lead not found")

    company_dict = {"name": company.name, "category": company.category, "city": company.city}
    analysis_dict = {}
    if company.analysis:
        analysis_dict = {
            "score_breakdown": company.analysis.score_breakdown,
            "possible_services": company.analysis.possible_services,
            "reasons": [],
        }
    offer = await generate_offer(company_dict, analysis_dict, req.channel, req.tone)

    # Persist as a draft message
    msg = Message(
        company_id=company.id,
        channel=req.channel.value,
        subject=offer["subject"],
        body=offer["body"],
        status="draft",
    )
    db.add(msg)
    await db.commit()

    return OfferResponse(
        company_id=company.id,
        channel=req.channel,
        subject=offer["subject"],
        body=offer["body"],
        used_llm=offer["used_llm"],
    )


@router.post("", response_model=CampaignOut)
async def create_campaign(req: CampaignCreate, db: AsyncSession = Depends(get_db)):
    campaign = Campaign(
        name=req.name,
        channel=req.channel.value,
        subject_template=req.subject_template,
        body_template=req.body_template,
        followup_days=req.followup_days,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return CampaignOut.model_validate(campaign)


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    return [CampaignOut.model_validate(c) for c in res.scalars().all()]


@router.get("/messages", response_model=list[MessageOut])
async def list_messages(company_id: int | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Message).order_by(Message.created_at.desc())
    if company_id:
        stmt = stmt.where(Message.company_id == company_id)
    res = await db.execute(stmt)
    return [MessageOut.model_validate(m) for m in res.scalars().all()]
