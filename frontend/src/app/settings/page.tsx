import {
  Map as MapIcon,
  BrainCircuit,
  Mail,
  Boxes,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

interface IntegrationKey {
  name: string;
  desc: string;
  optional?: boolean;
}

interface IntegrationGroup {
  title: string;
  icon: LucideIcon;
  accent: string;
  blurb: string;
  keys: IntegrationKey[];
}

const GROUPS: IntegrationGroup[] = [
  {
    title: "Карты и поиск",
    icon: MapIcon,
    accent: "text-brand-500",
    blurb:
      "Источники данных о локальном бизнесе. OpenStreetMap работает без ключей и включён по умолчанию.",
    keys: [
      {
        name: "GOOGLE_MAPS_API_KEY",
        desc: "Google Places / Maps — поиск компаний и детали.",
        optional: true,
      },
      {
        name: "YANDEX_MAPS_API_KEY",
        desc: "Яндекс.Карты — поиск организаций по регионам РФ.",
        optional: true,
      },
      {
        name: "TWOGIS_API_KEY",
        desc: "2ГИС — справочник компаний и филиалов.",
        optional: true,
      },
    ],
  },
  {
    title: "AI / LLM",
    icon: BrainCircuit,
    accent: "text-purple-400",
    blurb:
      "Модель для анализа сайтов, оценки лидов и генерации предложений. Поддерживаются OpenAI-совместимые эндпоинты (Ollama, vLLM).",
    keys: [
      {
        name: "OPENAI_API_KEY",
        desc: "Ключ OpenAI (или совместимого провайдера).",
      },
      {
        name: "OPENAI_MODEL",
        desc: "Название модели, напр. gpt-4o-mini / llama3.",
      },
      {
        name: "OPENAI_BASE_URL",
        desc: "Базовый URL API — для Ollama / vLLM локально.",
        optional: true,
      },
    ],
  },
  {
    title: "Email",
    icon: Mail,
    accent: "text-cyan-400",
    blurb:
      "Отправка писем и цепочек follow-up. Настройте один из провайдеров.",
    keys: [
      {
        name: "SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD",
        desc: "Классическая отправка через SMTP-сервер.",
      },
      {
        name: "Gmail (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN)",
        desc: "Отправка от имени Gmail-аккаунта через OAuth.",
        optional: true,
      },
      {
        name: "Microsoft Graph (MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET)",
        desc: "Outlook / Microsoft 365 через Graph API.",
        optional: true,
      },
    ],
  },
  {
    title: "CRM / Экспорт",
    icon: Boxes,
    accent: "text-green-400",
    blurb:
      "Синхронизация лидов во внешние системы и экспорт данных.",
    keys: [
      { name: "HUBSPOT_TOKEN", desc: "HubSpot — контакты и сделки.", optional: true },
      {
        name: "amoCRM (AMOCRM_SUBDOMAIN / AMOCRM_ACCESS_TOKEN)",
        desc: "amoCRM — воронки и сделки.",
        optional: true,
      },
      {
        name: "BITRIX24_WEBHOOK_URL",
        desc: "Битрикс24 — входящий вебхук для лидов.",
        optional: true,
      },
      {
        name: "NOTION_TOKEN / NOTION_DATABASE_ID",
        desc: "Notion — база лидов в таблице.",
        optional: true,
      },
      {
        name: "Google Sheets (GOOGLE_OAUTH_* / GOOGLE_SHEETS_SPREADSHEET_ID)",
        desc: "Экспорт лидов в Google Таблицы.",
        optional: true,
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Настройки</h1>
        <p className="page-subtitle">
          Интеграции и переменные окружения. Все ключи задаются в{" "}
          <span className="text-white/80">backend .env</span> — фронтенд их не
          хранит.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <span>
          Секреты не вводятся через интерфейс. Отредактируйте файл{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-amber-100">
            backend/.env
          </code>{" "}
          и перезапустите сервис.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="card p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                  <Icon className={`h-5 w-5 ${group.accent}`} />
                </div>
                <h2 className="text-base font-semibold text-white">
                  {group.title}
                </h2>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-muted">
                {group.blurb}
              </p>

              <ul className="space-y-2">
                {group.keys.map((k) => (
                  <li
                    key={k.name}
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <code className="break-all text-xs font-semibold text-brand-100">
                        {k.name}
                      </code>
                      {k.optional && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                          опц.
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">{k.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
