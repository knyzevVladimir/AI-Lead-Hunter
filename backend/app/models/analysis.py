"""AI analysis result attached to a company (latest snapshot)."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import WebsiteStatus


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), unique=True)

    # Website presence & quality
    website_status: Mapped[str] = mapped_column(String(32), default=WebsiteStatus.none.value)
    # website_checks stores booleans/values: https, mobile_friendly, load_ms,
    # modern_design, online_booking, contact_form, has_map, favicon, seo, robots_txt, sitemap_xml
    website_checks: Mapped[dict] = mapped_column(JSON, default=dict)

    # Google Business issues (list of human-readable strings)
    gbp_issues: Mapped[list] = mapped_column(JSON, default=list)

    # Social presence analysis {network: {found, followers, last_post, links_site}}
    social_analysis: Mapped[dict] = mapped_column(JSON, default=dict)

    # Scoring & recommendations
    ai_score: Mapped[int] = mapped_column(Integer, default=0, index=True)
    score_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    possible_services: Mapped[list] = mapped_column(JSON, default=list)  # list[ServiceType]
    summary: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="analysis")
