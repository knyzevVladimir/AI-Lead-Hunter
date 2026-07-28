"""Aggregate all API routers under the API prefix."""
from fastapi import APIRouter

from app.api.routes import (
    campaigns,
    chat,
    crm,
    exports,
    integrations,
    leads,
    search,
    stats,
)

api_router = APIRouter()
api_router.include_router(search.router)
api_router.include_router(leads.router)
api_router.include_router(crm.router)
api_router.include_router(campaigns.router)
api_router.include_router(chat.router)
api_router.include_router(stats.router)
api_router.include_router(exports.router)
api_router.include_router(integrations.router)
