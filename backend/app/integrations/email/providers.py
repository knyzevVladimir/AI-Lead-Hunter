"""Email sending providers: SMTP, Gmail API, Microsoft Graph (Outlook).

Each exposes: is_configured() -> bool and async send(to, subject, body, html=False).
A unified `send_email` picks the configured/default provider.
"""
from __future__ import annotations

import base64
from email.message import EmailMessage

import httpx

from app.core.config import settings
from app.integrations.oauth import google_access_token, microsoft_access_token


def _build_mime(sender: str, to: str, subject: str, body: str, html: bool) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    if html:
        msg.set_content("Please view this message in an HTML-capable client.")
        msg.add_alternative(body, subtype="html")
    else:
        msg.set_content(body)
    return msg


# ---------------- SMTP ----------------
class SMTPProvider:
    name = "smtp"

    def is_configured(self) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_FROM)

    async def send(self, to: str, subject: str, body: str, html: bool = False) -> dict:
        import aiosmtplib

        msg = _build_mime(settings.SMTP_FROM, to, subject, body, html)
        kwargs: dict = {
            "hostname": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "username": settings.SMTP_USER or None,
            "password": settings.SMTP_PASSWORD or None,
        }
        if settings.SMTP_USE_SSL or settings.SMTP_PORT == 465:
            kwargs["use_tls"] = True  # implicit TLS (465)
        # For 587, aiosmtplib auto-negotiates STARTTLS.
        await aiosmtplib.send(msg, **kwargs)
        return {"provider": self.name, "status": "sent", "to": to}


# ---------------- Gmail API ----------------
class GmailProvider:
    name = "gmail"

    def is_configured(self) -> bool:
        return bool(
            settings.GMAIL_CLIENT_ID and settings.GMAIL_CLIENT_SECRET and settings.GMAIL_REFRESH_TOKEN
        )

    async def send(self, to: str, subject: str, body: str, html: bool = False) -> dict:
        token = await google_access_token(
            settings.GMAIL_CLIENT_ID, settings.GMAIL_CLIENT_SECRET, settings.GMAIL_REFRESH_TOKEN
        )
        sender = settings.GMAIL_FROM or "me"
        msg = _build_mime(sender, to, subject, body, html)
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"raw": raw},
            )
            r.raise_for_status()
            return {"provider": self.name, "status": "sent", "id": r.json().get("id"), "to": to}


# ---------------- Microsoft Graph ----------------
class OutlookProvider:
    name = "outlook"

    def is_configured(self) -> bool:
        base = settings.MS_CLIENT_ID and settings.MS_CLIENT_SECRET
        if settings.MS_APP_ONLY:
            return bool(base and settings.MS_SENDER and settings.MS_TENANT_ID)
        return bool(base and settings.MS_REFRESH_TOKEN)

    async def send(self, to: str, subject: str, body: str, html: bool = False) -> dict:
        token = await microsoft_access_token()
        endpoint = (
            f"https://graph.microsoft.com/v1.0/users/{settings.MS_SENDER}/sendMail"
            if settings.MS_APP_ONLY
            else "https://graph.microsoft.com/v1.0/me/sendMail"
        )
        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML" if html else "Text", "content": body},
                "toRecipients": [{"emailAddress": {"address": to}}],
            },
            "saveToSentItems": True,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
            )
            r.raise_for_status()  # 202 Accepted on success
            return {"provider": self.name, "status": "sent", "to": to}


_PROVIDERS = {p.name: p for p in (SMTPProvider(), GmailProvider(), OutlookProvider())}


def get_email_provider(name: str | None = None):
    return _PROVIDERS.get(name or settings.DEFAULT_EMAIL_PROVIDER, _PROVIDERS["smtp"])


def email_status() -> dict[str, bool]:
    return {name: p.is_configured() for name, p in _PROVIDERS.items()}


async def send_email(to: str, subject: str, body: str, html: bool = False, provider: str | None = None) -> dict:
    prov = get_email_provider(provider)
    if not prov.is_configured():
        raise RuntimeError(f"Email provider '{prov.name}' is not configured")
    return await prov.send(to, subject, body, html)
