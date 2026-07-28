"""End-to-end smoke test using FastAPI TestClient + synthetic data.

Verifies: app boots, DB tables create, ingest, analyze, scoring, leads list,
CRM status change, offer generation, AI chat parsing, dashboard stats, CSV export.
"""
import asyncio
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./smoke.db")
os.environ.setdefault("ANALYZER_TIMEOUT", "3")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def run():
    # Seed synthetic data + analyze before hitting the API
    from app.core.database import init_db
    from scripts.seed import analyze_all, seed_synthetic

    async def _seed():
        await init_db()
        n = await seed_synthetic()
        await analyze_all()
        return n

    n = asyncio.run(_seed())
    print(f"[seed] inserted {n} synthetic companies + analyzed")

    with TestClient(app) as client:
        r = client.get("/health")
        assert r.status_code == 200, r.text
        print("[health]", r.json())

        r = client.get("/api/leads?limit=100")
        data = r.json()
        assert r.status_code == 200, r.text
        print(f"[leads] total={data['total']} sample_scores=", [i['ai_score'] for i in data['items'][:5]])
        assert data["total"] >= 5

        lead_id = data["items"][0]["id"]
        r = client.get(f"/api/leads/{lead_id}")
        detail = r.json()
        assert r.status_code == 200, r.text
        print(f"[lead detail] {detail['name']} score={detail['ai_score']} services={detail['analysis']['possible_services'] if detail['analysis'] else None}")

        r = client.patch(f"/api/crm/{lead_id}/status", json={"status": "negotiation", "note": "test"})
        assert r.status_code == 200, r.text
        print("[crm] status ->", r.json()["status"])

        r = client.post("/api/campaigns/offer", json={"company_id": lead_id, "channel": "email"})
        assert r.status_code == 200, r.text
        offer = r.json()
        print(f"[offer] subject='{offer['subject']}' used_llm={offer['used_llm']}")
        print("        body:", offer["body"][:120].replace("\n", " "), "...")

        r = client.post("/api/chat", json={"message": "Найди барбершопы без сайта, отсортируй по вероятности"})
        assert r.status_code == 200, r.text
        chat = r.json()
        print(f"[chat] reply='{chat['reply']}' filters={ {k:v for k,v in chat['parsed_filters'].items() if v} }")

        r = client.get("/api/stats/dashboard")
        assert r.status_code == 200, r.text
        print("[dashboard]", r.json())

        r = client.get("/api/export/csv")
        assert r.status_code == 200, r.text
        lines = r.text.strip().splitlines()
        print(f"[export] csv rows={len(lines)} header={lines[0][:60]}...")

    print("\nSMOKE TEST PASSED ✅")


if __name__ == "__main__":
    run()
