"""CRM / export providers: push a lead into HubSpot, amoCRM, Bitrix24,
Notion, or append to Google Sheets.

Each exposes is_configured() and async push(lead: dict). A `Lead` dict carries:
{name, company, phone, email, website, note, category, city, ai_score}.
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.integrations.oauth import google_access_token


class HubSpotProvider:
    name = "hubspot"

    def is_configured(self) -> bool:
        return bool(settings.HUBSPOT_TOKEN)

    async def push(self, lead: dict) -> dict:
        props = {
            "firstname": lead.get("name", ""),
            "company": lead.get("company") or lead.get("name", ""),
            "phone": lead.get("phone") or "",
            "email": lead.get("email") or "",
            "website": lead.get("website") or "",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.hubapi.com/crm/v3/objects/contacts",
                headers={"Authorization": f"Bearer {settings.HUBSPOT_TOKEN}", "Content-Type": "application/json"},
                json={"properties": props},
            )
            r.raise_for_status()
            return {"provider": self.name, "id": r.json().get("id")}


class AmoCRMProvider:
    name = "amocrm"

    def is_configured(self) -> bool:
        return bool(settings.AMOCRM_SUBDOMAIN and settings.AMOCRM_ACCESS_TOKEN)

    async def push(self, lead: dict) -> dict:
        url = f"https://{settings.AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/contacts"
        cfv = []
        if lead.get("phone"):
            cfv.append({"field_code": "PHONE", "values": [{"value": lead["phone"], "enum_code": "WORK"}]})
        if lead.get("email"):
            cfv.append({"field_code": "EMAIL", "values": [{"value": lead["email"], "enum_code": "WORK"}]})
        body = [{"name": lead.get("name", ""), "custom_fields_values": cfv or None}]
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.AMOCRM_ACCESS_TOKEN}", "Content-Type": "application/json"},
                json=body,
            )
            r.raise_for_status()
            return {"provider": self.name, "response": r.json().get("_embedded", {})}


class Bitrix24Provider:
    name = "bitrix24"

    def is_configured(self) -> bool:
        return bool(settings.BITRIX24_WEBHOOK_URL)

    async def push(self, lead: dict) -> dict:
        base = settings.BITRIX24_WEBHOOK_URL.rstrip("/")
        url = f"{base}/crm.lead.add.json"
        fields = {
            "TITLE": lead.get("name", "Lead"),
            "NAME": lead.get("name", ""),
            "COMPANY_TITLE": lead.get("company") or lead.get("name", ""),
            "COMMENTS": lead.get("note", ""),
        }
        if lead.get("phone"):
            fields["PHONE"] = [{"VALUE": lead["phone"], "VALUE_TYPE": "WORK"}]
        if lead.get("email"):
            fields["EMAIL"] = [{"VALUE": lead["email"], "VALUE_TYPE": "WORK"}]
        if lead.get("website"):
            fields["WEB"] = [{"VALUE": lead["website"], "VALUE_TYPE": "WORK"}]
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, json={"fields": fields})
            r.raise_for_status()
            return {"provider": self.name, "id": r.json().get("result")}


class NotionProvider:
    name = "notion"

    def is_configured(self) -> bool:
        return bool(settings.NOTION_TOKEN and settings.NOTION_DATABASE_ID)

    async def push(self, lead: dict) -> dict:
        properties: dict = {
            "Name": {"title": [{"text": {"content": lead.get("name", "")}}]},
        }
        if lead.get("phone"):
            properties["Phone"] = {"phone_number": lead["phone"]}
        if lead.get("email"):
            properties["Email"] = {"email": lead["email"]}
        if lead.get("website"):
            properties["Website"] = {"url": lead["website"]}
        body = {"parent": {"database_id": settings.NOTION_DATABASE_ID}, "properties": properties}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.notion.com/v1/pages",
                headers={
                    "Authorization": f"Bearer {settings.NOTION_TOKEN}",
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            r.raise_for_status()
            return {"provider": self.name, "id": r.json().get("id")}


class GoogleSheetsProvider:
    name = "google_sheets"

    def is_configured(self) -> bool:
        return bool(
            settings.GOOGLE_OAUTH_CLIENT_ID
            and settings.GOOGLE_OAUTH_CLIENT_SECRET
            and settings.GOOGLE_REFRESH_TOKEN
            and settings.GOOGLE_SHEETS_SPREADSHEET_ID
        )

    async def push(self, lead: dict) -> dict:
        token = await google_access_token(
            settings.GOOGLE_OAUTH_CLIENT_ID, settings.GOOGLE_OAUTH_CLIENT_SECRET, settings.GOOGLE_REFRESH_TOKEN
        )
        sid = settings.GOOGLE_SHEETS_SPREADSHEET_ID
        rng = settings.GOOGLE_SHEETS_RANGE
        row = [
            lead.get("name", ""), lead.get("category", ""), lead.get("city", ""),
            lead.get("phone", ""), lead.get("email", ""), lead.get("website", ""),
            str(lead.get("ai_score", "")),
        ]
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/{rng}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS"
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"values": [row]},
            )
            r.raise_for_status()
            return {"provider": self.name, "updates": r.json().get("updates", {})}


_PROVIDERS = {
    p.name: p
    for p in (HubSpotProvider(), AmoCRMProvider(), Bitrix24Provider(), NotionProvider(), GoogleSheetsProvider())
}


def get_crm_provider(name: str):
    if name not in _PROVIDERS:
        raise KeyError(f"Unknown CRM/export target '{name}'")
    return _PROVIDERS[name]


def crm_status() -> dict[str, bool]:
    return {name: p.is_configured() for name, p in _PROVIDERS.items()}


async def push_lead(target: str, lead: dict) -> dict:
    prov = get_crm_provider(target)
    if not prov.is_configured():
        raise RuntimeError(f"Export target '{target}' is not configured")
    return await prov.push(lead)
