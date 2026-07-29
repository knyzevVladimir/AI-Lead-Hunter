# Frontend architecture

## Goal

Replace the existing interface with a production-grade SaaS frontend while preserving every FastAPI contract. The frontend remains Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, TanStack Query and React Leaflet.

## Product principles

- Quiet, information-dense SaaS design inspired by Linear, Stripe, Attio and Vercel.
- White and cool-neutral surfaces, one restrained violet accent, 12–16px radii and soft elevation.
- Progressive disclosure instead of permanently visible controls.
- Every async surface has loading, empty, error and retry states.
- Desktop-first productivity with complete mobile adaptation.
- No mocked backend records. Charts and KPIs are derived from live API data.

## Module boundaries

```text
src/
  app/                 route composition only
  components/
    ui/                design-system primitives
    layout/            shell, sidebar, header, command menu
    dashboard/         overview metrics and visualizations
    search/            discovery form and result cards
    leads/             data grid and lead detail modules
    map/               React Leaflet workspace
    crm/               kanban, card and activity UI
    campaigns/         campaigns and message UI
    chat/              conversation and result cards
    analytics/         charts and derived insights
    integrations/      integration catalog
    settings/          preferences and configuration guidance
  hooks/               cross-feature hooks
  providers/           query, shell, toast and preferences providers
  services/            typed HTTP client, endpoints and query keys
  types/               API and view-model contracts
  utils/               formatting, class names and aggregations
  theme/               navigation and product constants
```

## Data strategy

TanStack Query is the single server-state layer. Mutations invalidate narrow query-key families and use optimistic updates where rollback is safe. The API client keeps backend names exactly as defined by FastAPI. Dashboard and analytics enrich live records in the browser by aggregating `created_at`, `last_checked_at`, score, category, city, region, status, messages and campaigns.

The backend does not expose chat streaming, chat-history persistence, editable environment settings or a standalone comment endpoint. The UI therefore:

- progressively reveals completed chat responses without claiming transport streaming;
- stores chat history locally in the browser;
- presents secret-backed settings as read-only connection guidance;
- stores CRM notes through the existing status-history endpoint by patching the current status with a note.

## Routes

- `/dashboard` — operational overview
- `/search` — business discovery
- `/map` — geospatial lead workspace
- `/leads` — infinite, selectable data grid
- `/leads/[id]` — lead intelligence workspace
- `/crm` — drag-and-drop pipeline
- `/campaigns` — campaign and message operations
- `/analytics` — derived acquisition and pipeline analytics
- `/chat` — conversational lead exploration
- `/integrations` — live integration status catalog
- `/settings` — local preferences and backend configuration reference

## Commit sequence

Foundation is committed first. Every route is then implemented, verified and committed independently so each page can be reviewed or reverted without coupling unrelated work.
