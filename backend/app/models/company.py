"""Company (lead) ORM model — the central entity of the platform."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CRMStatus, Source


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Provenance
    source: Mapped[str] = mapped_column(String(32), default=Source.osm.value, index=True)
    external_id: Mapped[str | None] = mapped_column(String(128), index=True)

    # Identity
    name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str | None] = mapped_column(String(128), index=True)
    description: Mapped[str | None] = mapped_column(Text)

    # Location
    address: Mapped[str | None] = mapped_column(String(512))
    city: Mapped[str | None] = mapped_column(String(128), index=True)
    region: Mapped[str | None] = mapped_column(String(128))
    country: Mapped[str | None] = mapped_column(String(128), index=True)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)

    # Contacts
    phone: Mapped[str | None] = mapped_column(String(64))
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    website: Mapped[str | None] = mapped_column(String(512))
    socials: Mapped[dict] = mapped_column(JSON, default=dict)  # {instagram, vk, telegram,...}

    # Reputation
    rating: Mapped[float | None] = mapped_column(Float)
    reviews_count: Mapped[int | None] = mapped_column(Integer)
    opening_hours: Mapped[str | None] = mapped_column(String(512))

    # Pipeline / CRM
    status: Mapped[str] = mapped_column(String(32), default=CRMStatus.new.value, index=True)
    ai_score: Mapped[int | None] = mapped_column(Integer, index=True)
    monitored: Mapped[bool] = mapped_column(default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    analysis: Mapped["Analysis | None"] = relationship(
        back_populates="company", uselist=False, cascade="all, delete-orphan"
    )
    status_history: Mapped[list["StatusHistory"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    change_history: Mapped[list["ChangeHistory"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
