# 🛰️ AI Lead Hunter

**AI-платформа для поиска локального бизнеса, анализа цифрового присутствия и автоматизации поиска клиентов.**

Находит компании на картах и в справочниках, анализирует их сайты и присутствие в интернете, присваивает AI Score (вероятность заинтересованности в услугах), генерирует персональные предложения и помогает вести коммуникацию и CRM.

---

## ✨ Что уже работает «из коробки»

- 🔎 **Поиск бизнеса — полностью без API-ключей**: **Яндекс.Карты** (парсер публичной выдачи, источник по умолчанию — отдаёт телефоны, сайты, рейтинги, отзывы, часы работы) и **OpenStreetMap** (Overpass + Nominatim, автоматический резерв, если Яндекс недоступен). **Google Places** и **2ГИС** — опционально, при наличии ключа.
- 🛡️ **Устойчивость парсера**: повторные попытки с экспоненциальной задержкой, ротация User-Agent, детекция капчи с понятным сообщением и автоматическим переключением на OSM — поиск не падает даже при анти-бот защите Яндекса.
- 🧠 **Реальный анализ сайта**: HTTPS/SSL, мобильная версия, favicon, форма связи, онлайн-запись, карта, SEO (title/description/H1), `robots.txt`, `sitemap.xml`, скорость загрузки, современность дизайна.
- 📊 **AI Score 0–100** — оценка перспективности лида + разбор слабых мест + список услуг, которые можно предложить.
- ✉️ **Генерация персонального предложения** (шаблон + LLM через OpenAI-совместимый эндпоинт: OpenAI / Ollama / vLLM).
- 🗂️ **CRM** со статусами и историей, канбан-доска.
- 🎨 **Современный светлый UI** в стиле классических SaaS (HubSpot): чистая дизайн-система, скелетоны загрузки, empty states, информативные статусы и фильтры.
- 💬 **AI-чат** — запросы на естественном языке («Найди стоматологии без сайта, отсортируй по вероятности»).
- 🗺️ **Карта** лидов (цвет по наличию сайта).
- 🔁 **Follow-up** и **мониторинг** изменений (Celery beat).
- 📤 **Экспорт**: CSV + пуш в **HubSpot / amoCRM / Bitrix24 / Notion / Google Sheets**.
- 📧 **Отправка писем**: SMTP / Gmail API / Microsoft Graph (Outlook).

---

## 🧱 Архитектура

```
Next.js (React, TS, Tailwind, Leaflet)  ──►  FastAPI (async)  ──►  PostgreSQL
                                                  │
                                                  ├── Celery + Redis (воркеры, планировщик)
                                                  ├── Парсеры: OSM / Google / Yandex / 2GIS
                                                  ├── Анализатор сайтов (httpx + BeautifulSoup)
                                                  ├── AI Score + генерация офферов (LLM-hook)
                                                  └── Интеграции: Email / CRM / Sheets / Notion
```

| Слой      | Технологии |
|-----------|-----------|
| Backend   | Python 3.12, FastAPI, SQLAlchemy 2 (async), Pydantic v2, Alembic, Celery, Redis, httpx, BeautifulSoup |
| Frontend  | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, React-Leaflet, TanStack Query |
| Данные    | PostgreSQL (SQLite для локального dev без Docker) |
| DevOps    | Docker, Docker Compose |

---

## 🚀 Быстрый старт (Docker)

```bash
cp .env.example .env          # заполните ключи по желанию (OSM работает без них)
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- Swagger UI → http://localhost:8000/docs

### ⚠️ Обновление со старой версии

Ранние версии проекта требовали `YANDEX_MAPS_API_KEY` — теперь Яндекс.Карты работают **полностью без ключа** (парсер публичной выдачи). Если после запуска поиск падает с ошибкой `422: YANDEX_MAPS_API_KEY is not configured`, вы запускаете устаревший код. Лечится так:

```bash
git pull origin main
docker compose up --build   # обязательно с --build: образ пересоберётся из свежего кода
```

### Наполнить демо-данными
```bash
docker compose exec backend python -m scripts.seed
```
Скрипт попробует реальный поиск в OSM, а при отсутствии сети создаст синтетические демо-компании и прогонит анализ.

---

## 🧑‍💻 Локальный запуск без Docker

**Backend** (по умолчанию SQLite, ключи не нужны):
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.seed                     # опционально: демо-данные
uvicorn app.main:app --reload              # http://localhost:8000/docs
```

**Frontend**:
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                                # http://localhost:3000
```

---

## 🔌 Подключение внешних API

Все ключи задаются в `.env` (см. `.env.example`). Ключи для поиска **не нужны**: по умолчанию работают Яндекс.Карты (парсер) и OpenStreetMap. Ничего не задано → поиск идёт через Яндекс/OSM без ключей, а офферы/чат работают в шаблонном режиме. Из внешних сервисов реально нужен только email-провайдер (для рассылки).

| Категория | Переменные | Заметки |
|-----------|-----------|---------|
| **Яндекс.Карты** | **— (без ключа)** | **Парсер публичной выдачи, источник по умолчанию. Авто-резерв → OSM** |
| OpenStreetMap | — (без ключа) | Overpass + Nominatim, резервный источник |
| Google Places | `GOOGLE_MAPS_API_KEY` | Опционально. Places API (New), Text Search |
| 2ГИС | `TWOGIS_API_KEY` | Опционально. Catalog API (contact_groups — платно) |
| LLM | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` | OpenAI / Ollama / vLLM |
| Email SMTP | `SMTP_HOST/PORT/USER/PASSWORD/FROM` | 587 STARTTLS или 465 SSL |
| Gmail | `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN/FROM` | scope `gmail.send` |
| Outlook | `MS_TENANT_ID/CLIENT_ID/CLIENT_SECRET` (+`MS_REFRESH_TOKEN` или `MS_APP_ONLY`+`MS_SENDER`) | Graph `Mail.Send` |
| HubSpot | `HUBSPOT_TOKEN` | Private App token |
| amoCRM | `AMOCRM_SUBDOMAIN`, `AMOCRM_ACCESS_TOKEN` | OAuth |
| Bitrix24 | `BITRIX24_WEBHOOK_URL` | Входящий вебхук |
| Notion | `NOTION_TOKEN`, `NOTION_DATABASE_ID` | версия API 2022-06-28 |
| Google Sheets | `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_SHEETS_SPREADSHEET_ID` | scope `spreadsheets` |

Статус всех интеграций доступен через `GET /api/integrations/status`.

---

## 📡 Основные эндпоинты API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/search` | Поиск бизнеса (source: openstreetmap/google_maps/yandex_maps/2gis) |
| GET  | `/api/leads` | Список лидов с фильтрами (`no_website`, `has_email`, `min_score`, …) |
| GET  | `/api/leads/{id}` | Карточка лида с анализом |
| POST | `/api/leads/{id}/analyze` | Анализ сайта + AI Score |
| POST | `/api/leads/analyze-batch` | Пакетный анализ |
| PATCH| `/api/crm/{id}/status` | Смена CRM-статуса |
| GET  | `/api/crm/board` | Канбан-доска |
| POST | `/api/campaigns/offer` | Генерация предложения |
| POST | `/api/chat` | AI-чат (NL → фильтры) |
| GET  | `/api/stats/dashboard` | Метрики дашборда |
| GET  | `/api/export/csv` | Экспорт CSV |
| POST | `/api/integrations/send` | Отправка письма |
| POST | `/api/integrations/export` | Пуш лидов в CRM/Sheets/Notion |
| GET  | `/api/integrations/status` | Что настроено |

---

## 📁 Структура

```
ai-lead-hunter/
├── backend/                 FastAPI + Celery
│   ├── app/
│   │   ├── api/routes/       search, leads, crm, campaigns, chat, stats, exports, integrations
│   │   ├── core/            config, database
│   │   ├── models/          Company, Analysis, CRM, Campaign, Message
│   │   ├── schemas/         Pydantic
│   │   ├── services/        parser (osm/google/yandex/2gis), analyzer, scoring, offer, aichat, pipeline
│   │   ├── integrations/    email/, crm/, oauth
│   │   └── workers/         Celery tasks + beat
│   ├── alembic/             миграции
│   └── scripts/             seed.py, smoke_test.py
├── frontend/                Next.js 14
│   └── src/{app,components,lib}
├── docker-compose.yml
└── .env.example
```

## 🔒 Юридическая заметка
Рассылка сообщений должна соответствовать правилам площадок и законодательству (согласие там, где оно требуется, и возможность отписаться). Инструмент готовит и помогает отправлять сообщения — ответственность за соответствие правилам на пользователе.

## 🧪 Тесты
- `backend/scripts/smoke_test.py` — сквозной прогон API (поиск→анализ→скоринг→CRM→оффер→чат→экспорт).
- Frontend: `npm run build` (типизация + сборка проходят).
