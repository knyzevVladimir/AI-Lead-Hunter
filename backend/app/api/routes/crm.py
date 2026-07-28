"""CRM: status transitions and a Kanban-style board."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Company, StatusHistory
from app.models.enums import CRMStatus
from app.schemas.schemas import CompanyOut, StatusHistoryOut, StatusUpdate

router = APIRouter(prefix="/crm", tags=["crm"])


@router.patch("/{lead_id}/status", response_model=CompanyOut)
async def update_status(lead_id: int, payload: StatusUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Company).options(selectinload(Company.analysis)).where(Company.id == lead_id)
    )
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Lead not found")

    old = company.status
    company.status = payload.status.value
    db.add(StatusHistory(company_id=company.id, old_status=old, new_status=payload.status.value, note=payload.note))
    await db.commit()
    await db.refresh(company)
    return CompanyOut.model_validate(company)


@router.get("/{lead_id}/status-history", response_model=list[StatusHistoryOut])
async def status_history(lead_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(StatusHistory)
        .where(StatusHistory.company_id == lead_id)
        .order_by(StatusHistory.created_at.desc())
    )
    return [StatusHistoryOut.model_validate(h) for h in res.scalars().all()]


@router.get("/board")
async def crm_board(db: AsyncSession = Depends(get_db)):
    """Return companies grouped by CRM status for a Kanban board."""
    res = await db.execute(select(Company).options(selectinload(Company.analysis)))
    companies = list(res.scalars().all())
    board: dict[str, list] = {s.value: [] for s in CRMStatus}
    for c in companies:
        board.setdefault(c.status, []).append(CompanyOut.model_validate(c).model_dump())
    return {"columns": [s.value for s in CRMStatus], "board": board}
