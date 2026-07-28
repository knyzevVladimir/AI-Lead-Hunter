"use client";

import { useState, useCallback } from "react";
import {
  Map as MapIcon,
  BrainCircuit,
  Mail,
  Boxes,
  KeyRound,
  Check,
  Copy,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import Reveal from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

interface IntegrationKey {
  name: string;
  desc: string;
  optional?: boolean;
}

interface IntegrationGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Tailwind text-* class for the icon colour. */
  accent: string;
  /** Glow colour passed as an inline box-shadow string for the icon tile. */
  glowColor: string;
  blurb: string;
  keys: IntegrationKey[];
}

const GROUPS: IntegrationGroup[] = [
  {
    id: "maps",
    title: "Карты и поиск",
    icon: MapIcon,
    accent: "text-brand-500",
    glowColor: "rgba(59,108,255,0.35)",
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
    id: "ai",
    title: "AI / LLM",
    icon: BrainCircuit,
    accent: "text-purple-400",
    glowColor: "rgba(167,139,250,0.35)",
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
    id: "email",
    title: "Email",
    icon: Mail,
    accent: "text-cyan-400",
    glowColor: "rgba(34,211,238,0.35)",
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
    id: "crm",
    title: "CRM / Экспорт",
    icon: Boxes,
    accent: "text-green-400",
    glowColor: "rgba(74,222,128,0.35)",
    blurb: "Синхронизация лидов во внешние системы и экспорт данных.",
    keys: [
      {
        name: "HUBSPOT_TOKEN",
        desc: "HubSpot — контакты и сделки.",
        optional: true,
      },
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

/* ------------------------------------------------------------------ */
/* Click-to-copy key button                                             */
/* ------------------------------------------------------------------ */

function CopyKeyButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!navigator?.clipboard) return; // clipboard unavailable (non-secure context)
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      // Reset after 2 s so the user can copy again if needed
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently swallow: the user can still select and copy manually
    }
  }, [name]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Скопировано!" : "Скопировать имя переменной"}
      className={clsx(
        "group relative inline-flex items-center gap-2 rounded-md px-2 py-1",
        "transition-all duration-200",
        "hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500/70",
        // Don't show pointer cursor if the clipboard is unavailable
        "cursor-pointer"
      )}
      aria-label={copied ? "Скопировано" : `Скопировать ${name}`}
    >
      <code className="break-all text-xs font-semibold text-brand-100">
        {name}
      </code>
      <span
        className={clsx(
          "shrink-0 transition-all duration-200",
          copied ? "text-green-400" : "text-muted opacity-0 group-hover:opacity-100"
        )}
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </span>
      {/* Confirmation label — slides in and fades out */}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 animate-fade-in whitespace-nowrap rounded bg-panel-2 px-2 py-0.5 text-[10px] font-medium text-green-300 shadow-lift ring-1 ring-white/10">
          Скопировано
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Quick-nav anchor                                                     */
/* ------------------------------------------------------------------ */

function QuickNav() {
  const scrollTo = (id: string) => {
    document.getElementById(`group-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="Быстрая навигация по разделам"
      className="flex flex-wrap gap-2"
    >
      {GROUPS.map((g, i) => {
        const Icon = g.icon;
        return (
          <Reveal key={g.id} delay={i * 50} from="left">
            <button
              type="button"
              onClick={() => scrollTo(g.id)}
              className={clsx(
                "chip-off flex items-center gap-1.5",
                `hover:${g.accent}`
              )}
            >
              <Icon className={clsx("h-3.5 w-3.5", g.accent)} />
              {g.title}
            </button>
          </Reveal>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Reveal from="up" blur>
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-subtitle">
            Интеграции и переменные окружения. Все ключи задаются в{" "}
            <span className="text-white/80">backend .env</span> — фронтенд их не
            хранит.
          </p>
        </div>
      </Reveal>

      {/* Quick nav anchors */}
      <Reveal delay={60}>
        <QuickNav />
      </Reveal>

      {/* Warning banner — improved styling */}
      <Reveal delay={80}>
        <div
          className={clsx(
            "flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm",
            "border border-amber-500/40 bg-amber-500/[0.08]",
            // Hairline gradient highlight on the left edge for visual weight
            "relative overflow-hidden"
          )}
          role="note"
        >
          {/* Left accent bar */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-gradient-to-b from-amber-400/80 via-amber-500/60 to-transparent"
          />
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-amber-200/90 leading-relaxed">
            Секреты не вводятся через интерфейс. Отредактируйте файл{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-amber-100">
              backend/.env
            </code>{" "}
            и перезапустите сервис. Нажмите на имя переменной, чтобы
            скопировать его.
          </p>
        </div>
      </Reveal>

      {/* Group cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {GROUPS.map((group, gi) => {
          const Icon = group.icon;
          return (
            // The id lets the quick-nav anchors scroll directly to each card
            <div key={group.id} id={`group-${group.id}`}>
              <Reveal delay={gi * 80}>
                <TiltCard max={5} lift={4}>
                  <div className="card ring-gradient p-5">
                    {/* Card header */}
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition-shadow duration-300"
                        style={{
                          // Soft coloured glow that matches the group's accent
                          boxShadow: `0 0 18px -4px ${group.glowColor}`,
                        }}
                      >
                        <Icon className={clsx("h-5 w-5", group.accent)} />
                      </div>
                      <h2 className="text-base font-semibold text-white">
                        {group.title}
                      </h2>
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-muted">
                      {group.blurb}
                    </p>

                    {/* Key list */}
                    <ul className="space-y-2">
                      {group.keys.map((k, ki) => (
                        <Reveal key={k.name} delay={gi * 80 + ki * 40}>
                          <li className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2.5 transition-colors duration-200 hover:border-white/20 hover:bg-ink/80">
                            <div className="flex items-center gap-2">
                              {/* Click-to-copy wraps the key name */}
                              <CopyKeyButton name={k.name} />
                              {k.optional && (
                                <span className="ml-auto shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                                  опц.
                                </span>
                              )}
                            </div>
                            <p className="mt-1 pl-2 text-xs text-muted">
                              {k.desc}
                            </p>
                          </li>
                        </Reveal>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
