"""Pydantic v2 schemas for request/response validation."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Channel, CRMStatus, Source, WebsiteStatus


# ---------- Search ----------
class SearchRequest(BaseModel):
    query: str = Field(..., description="Category or keywords, e.g. 'барбершоп'", examples=["барбершоп"])
    city: str | None = Field(None, examples=["Москва"])
    country: str | None = None
    region: str | None = None
    radius_km: float | None = Field(None, ge=0, le=100, description="Radius around city center")
    limit: int = Field(50, ge=1, le=500)
    source: Source = Source.osm


class SearchResult(BaseModel):
    found: int
    saved: int
    company_ids: list[int]


# ---------- Analysis ----------
class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    website_status: WebsiteStatus
    website_checks: dict[str, Any]
    gbp_issues: list[str]
    social_analysis: dict[str, Any]
    ai_score: int
    score_breakdown: dict[str, Any]
    possible_services: list[str]
    summary: str | None
    created_at: datetime


# ---------- Company ----------
class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: Source
    name: str
    category: str | None
    address: str | None
    city: str | None
    country: str | None
    lat: float | None
    lng: float | None
    phone: str | None
    email: str | None
    website: str | None
    socials: dict[str, Any]
    rating: float | None
    reviews_count: int | None
    status: CRMStatus
    ai_score: int | None
    monitored: bool
    created_at: datetime
    last_checked_at: datetime | None


class CompanyDetail(CompanyOut):
    description: str | None = None
    region: str | None = None
    opening_hours: str | None = None
    analysis: AnalysisOut | None = None


class CompanyList(BaseModel):
    total: int
    items: list[CompanyOut]


# ---------- CRM ----------
class StatusUpdate(BaseModel):
    status: CRMStatus
    note: str | None = None


class StatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    old_status: str | None
    new_status: str
    note: str | None
    created_at: datetime


class ChangeHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    field: str
    old_value: str | None
    new_value: str | None
    note: str | None
    created_at: datetime


# ---------- Offer / Campaign ----------
class OfferRequest(BaseModel):
    company_id: int
    channel: Channel = Channel.email
    tone: str = Field("professional", description="professional | friendly | short")


class OfferResponse(BaseModel):
    company_id: int
    channel: Channel
    subject: str | None
    body: str
    used_llm: bool


class CampaignCreate(BaseModel):
    name: str
    channel: Channel = Channel.email
    subject_template: str | None = None
    body_template: str | None = None
    followup_days: str = "3,7"


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    channel: Channel
    subject_template: str | None
    body_template: str | None
    followup_days: str | None
    status: str
    created_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    campaign_id: int | None
    company_id: int
    channel: Channel
    subject: str | None
    body: str
    status: str
    followup_step: int
    sent_at: datetime | None
    created_at: datetime


# ---------- AI Chat ----------
class ChatRequest(BaseModel):
    message: str = Field(..., examples=["Найди стоматологии Праги без сайта"])


class ChatResponse(BaseModel):
    reply: str
    parsed_filters: dict[str, Any]
    results: list[CompanyOut]
    total: int


# ---------- Stats ----------
class DashboardStats(BaseModel):
    companies_found: int
    without_website: int
    with_email: int
    very_promising: int  # ai_score >= 80
    emails_sent: int
    replies: int
    conversion: float  # %
