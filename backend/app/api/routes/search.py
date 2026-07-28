"""Business search endpoint — runs the parser and ingests results."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import SearchRequest, SearchResult
from app.services.pipeline import search_and_ingest

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResult)
async def search(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    """Search for businesses (default source: OpenStreetMap) and store them.

    Example: {"query": "барбершоп", "city": "Москва", "radius_km": 20, "limit": 50}
    """
    try:
        found, ids = await search_and_ingest(
            db,
            query=req.query,
            city=req.city,
            country=req.country,
            region=req.region,
            radius_km=req.radius_km,
            limit=req.limit,
            source=req.source.value,
        )
    except RuntimeError as e:
        # Provider not configured (missing API key)
        raise HTTPException(422, str(e))
    except Exception as e:  # noqa: BLE001 — upstream/provider error
        raise HTTPException(502, f"Search provider error: {e}")
    return SearchResult(found=found, saved=len(ids), company_ids=ids)
