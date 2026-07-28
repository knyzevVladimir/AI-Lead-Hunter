"""Seed the database with demo leads.

Tries a real key-free search first (Yandex.Maps → OpenStreetMap fallback); if
the network is unavailable it falls back to synthetic demo companies so the UI
is populated for a demo.

Run:  python -m scripts.seed
"""
import asyncio
import random

from app.core.database import AsyncSessionLocal, init_db
from app.models import Company
from app.services.parser.osm import RawCompany
from app.services.pipeline import analyze_company, ingest_raw, search_and_ingest

DEMO_CATEGORIES = [("барбершоп", "Москва"), ("салон красоты", "Москва"), ("стоматология", "Москва")]

SYNTHETIC = [
    ("Барбершоп 'Бородач'", "hairdresser", None, "+7 495 111-22-33", "info@borodach.example"),
    ("Салон красоты 'Аврора'", "beauty", None, None, "hello@avrora.example"),
    ("Стоматология 'Улыбка'", "dentist", "https://ulybka-dent.example", "+7 495 222-33-44", None),
    ("Барбершоп 'Топор'", "hairdresser", "http://topor-barber.example", None, None),
    ("Кофейня 'Зерно'", "cafe", "https://zerno.example", "+7 495 333-44-55", "cafe@zerno.example"),
    ("Автосервис 'Мотор'", "car_repair", None, "+7 495 444-55-66", None),
    ("Фитнес 'Энергия'", "fitness_centre", "https://energy-fit.example", None, "gym@energy.example"),
    ("Салон 'Шарм'", "beauty", None, None, None),
]


async def seed_real() -> int:
    total = 0
    async with AsyncSessionLocal() as db:
        for query, city in DEMO_CATEGORIES:
            try:
                found, ids = await search_and_ingest(db, query=query, city=city, radius_km=15, limit=20)
                total += len(ids)
                print(f"  {query} @ {city}: found {found}, saved {len(ids)}")
            except Exception as e:  # noqa: BLE001
                print(f"  search failed for {query}: {e}")
    return total


async def seed_synthetic() -> int:
    async with AsyncSessionLocal() as db:
        raw = []
        for i, (name, cat, site, phone, email) in enumerate(SYNTHETIC):
            raw.append(
                RawCompany(
                    source="manual",
                    external_id=f"demo/{i}",
                    name=name,
                    category=cat,
                    city="Москва",
                    country="Россия",
                    lat=55.75 + random.uniform(-0.1, 0.1),
                    lng=37.61 + random.uniform(-0.1, 0.1),
                    phone=phone,
                    email=email,
                    website=site,
                    socials={"instagram": "https://instagram.com/demo"} if i % 3 == 0 else {},
                )
            )
        ids = await ingest_raw(db, raw)
        # assign some ratings/reviews
        for cid in ids:
            c = await db.get(Company, cid)
            c.rating = round(random.uniform(3.4, 4.9), 1)
            c.reviews_count = random.randint(3, 120)
        await db.commit()
        return len(ids)


async def analyze_all():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        res = await db.execute(select(Company).options(selectinload(Company.analysis)))
        companies = list(res.scalars().all())
        for c in companies:
            try:
                await analyze_company(db, c)
            except Exception as e:  # noqa: BLE001
                print(f"  analyze failed for {c.name}: {e}")
        print(f"  analyzed {len(companies)} companies")


async def main():
    await init_db()
    print("Seeding real data from Yandex.Maps / OpenStreetMap (key-free)...")
    saved = await seed_real()
    if saved == 0:
        print("No network/real data — inserting synthetic demo companies...")
        saved = await seed_synthetic()
    print(f"Saved {saved} companies. Running analysis...")
    await analyze_all()
    print("Done. Start the API and open /docs")


if __name__ == "__main__":
    asyncio.run(main())
