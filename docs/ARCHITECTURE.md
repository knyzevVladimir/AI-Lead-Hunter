# Architecture

## AI Pipeline

```
Поиск (Яндекс.Карты/OSM, без ключей) → Сбор данных → Анализ сайта → AI Score →
Генерация предложения → Рассылка → Ответ → CRM → Клиент
```

Each stage maps to concrete code:

| Stage | Module |
|-------|--------|
| Поиск | `app/services/parser/{osm,google,yandex,twogis}.py` + `registry.py` |
| Сбор данных | `app/services/pipeline.py::ingest_raw` (upsert by source+external_id) |
| Анализ сайта | `app/services/analyzer/website.py` (httpx + BeautifulSoup) |
| AI Score | `app/services/scoring/scorer.py` |
| Предложение | `app/services/offer/generator.py` (template + LLM) |
| AI-чат | `app/services/aichat/nlu.py` (NL → filters) |
| Рассылка | `app/integrations/email/providers.py` |
| CRM/Экспорт | `app/integrations/crm/providers.py`, `app/api/routes/exports.py` |
| Фон/расписание | `app/workers/tasks.py` + `celery_app.py` (monitoring, follow-ups) |

## Data model

- **Company** — центральная сущность лида (контакты, гео, рейтинг, CRM-статус, ai_score, monitored).
- **Analysis** — 1:1 с Company: website_status, website_checks (JSON), gbp_issues, social_analysis, ai_score, score_breakdown, possible_services, summary.
- **StatusHistory** — аудит смены CRM-статусов.
- **ChangeHistory** — журнал изменений при мониторинге (появился сайт, сменился рейтинг…).
- **Campaign / Message** — кампании и сгенерированные сообщения (со статусом и шагом follow-up).

## AI Score (0–100)

Оценка **перспективности лида для агентства**: чем больше «пробелов» у бизнеса, тем выше балл.
Складывается из штрафных баллов за: отсутствие/поломку сайта, отсутствие HTTPS, немобильный или
устаревший дизайн, отсутствие SEO/`sitemap`/`robots`, отсутствие онлайн-записи и формы, медленную
загрузку, мало отзывов, низкий рейтинг, отсутствие соцсетей. Итог обрезается до 100. Разбор баллов
и рекомендованные услуги возвращаются в `score_breakdown` и `possible_services`.

## Провайдеры поиска

Единый интерфейс `search(query, city, country, region, radius_km, limit) -> list[RawCompany]`.
`registry.get_parser(source)` выбирает провайдера; `provider_configured(source)` сообщает, готов ли он.

**Поиск работает без API-ключей:**

- **Яндекс.Карты** (`yandex.py`) — источник по умолчанию. Парсит публичную выдачу
  Яндекс.Карт: со страницы результатов извлекается встроенный JSON
  (`<script class="state-view">`) с карточками организаций (телефон, сайт, соцсети,
  рейтинг, отзывы, часы работы). Ключ и token-handshake не нужны — это обычный HTML.
  Доп. страницы (сверх ~25) подтягиваются best-effort через внутренний
  `/maps/api/search`; если он недоступен, возвращается первая страница.
- **OpenStreetMap** (`osm.py`) — Overpass + Nominatim, тоже без ключей. Работает как
  автоматический резерв: если Яндекс упёрся в капчу или вернул пусто,
  `pipeline.search_and_ingest` прозрачно повторяет запрос через OSM
  (флаг `YANDEX_SEARCH_FALLBACK_OSM`, по умолчанию включён).
- **Google Places** / **2ГИС** — опционально, включаются добавлением ключа.

Геокодирование (город → координаты) — общий бесключевой хелпер Nominatim (`geo.py`).

## Расширение

- Новый источник карт → добавить класс-парсер и зарегистрировать в `registry.py`.
- Новый канал рассылки → добавить провайдер в `integrations/email/providers.py`.
- Новая CRM → добавить провайдер в `integrations/crm/providers.py`.
