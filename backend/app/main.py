"""AI Lead Hunter — FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-платформа для поиска локального бизнеса, анализа цифрового присутствия и автоматизации поиска клиентов.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/", tags=["system"])
async def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "api": settings.API_PREFIX,
        "endpoints": [
            "POST /api/search",
            "GET  /api/leads",
            "POST /api/leads/{id}/analyze",
            "PATCH /api/crm/{id}/status",
            "POST /api/campaigns/offer",
            "POST /api/chat",
            "GET  /api/stats/dashboard",
            "GET  /api/export/csv",
        ],
    }
