"""Outreach campaigns and generated messages."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import Channel, MessageStatus


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    channel: Mapped[str] = mapped_column(String(32), default=Channel.email.value)
    subject_template: Mapped[str | None] = mapped_column(Text)
    body_template: Mapped[str | None] = mapped_column(Text)
    # follow-up cadence in days, e.g. [3, 7]
    followup_days: Mapped[str | None] = mapped_column(String(64), default="3,7")
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    messages: Mapped[list["Message"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int | None] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"))
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    channel: Mapped[str] = mapped_column(String(32), default=Channel.email.value)
    subject: Mapped[str | None] = mapped_column(String(512))
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default=MessageStatus.draft.value, index=True)
    followup_step: Mapped[int] = mapped_column(Integer, default=0)  # 0=initial, 1=+3d, 2=+7d

    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reply_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campaign: Mapped["Campaign | None"] = relationship(back_populates="messages")
    company: Mapped["Company"] = relationship(back_populates="messages")
