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
  iconBg: string;
  accent: string;
  blurb: string;
  keys: IntegrationKey[];
}

const GROUPS: IntegrationGroup[] = [
  {
    title: "Карты и поиск",
    icon: MapIcon,
    iconBg: "bg-brand-50",
    accent: "text-brand-500",
    blurb:
      "Источники данных о локальном бизнесе. Яндекс.Карты (по умолчанию) и OpenStreetMap работают полностью без ключей. Google и 2ГИС — по желанию, при наличии ключа.",
    keys: [
      {
        name: "Яндекс.Карты — без ключа",
        desc: "Источник по умолчанию. Поиск организаций работает через встроенный парсер Яндекс.Карт — API-ключ не нужен.",
      },
      {
        name: "OpenStreetMap — без ключа",
        desc: "Резервный источник (Overpass + Nominatim). Используется автоматически, если Яндекс недоступен.",
      },
      {
        name: "GOOGLE_MAPS_API_KEY",
        desc: "Google Places / Maps — поиск компаний и детали.",
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
    iconBg: "bg-purple-50",
    accent: "text-purple-500",
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
    iconBg: "bg-cyan-50",
    accent: "text-cyan-600",
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
    iconBg: "bg-emerald-50",
    accent: "text-emerald-600",
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
          <span className="font-medium text-ink">backend .env</span> — фронтенд
          их не хранит.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <span>
          Секреты не вводятся через интерфейс. Отредактируйте файл{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
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
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${group.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${group.accent}`} />
                </div>
                <h2 className="text-base font-semibold text-ink">
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
                    className="rounded-lg border border-line bg-slate-50/60 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <code className="break-all text-xs font-semibold text-ink">
                        {k.name}
                      </code>
                      {k.optional && (
                        <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
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
