import type { CRMStatus, Source } from "@/types/domain";

export const PRODUCT_NAME = "AI Lead Hunter";
export const ESTIMATED_DEAL_VALUE = 75_000;

export const STATUS_META: Record<CRMStatus, { label: string; short: string; color: string; dot: string }> = {
  new: { label: "Новый", short: "Новые", color: "slate", dot: "#94a3b8" },
  analyzed: { label: "Проанализирован", short: "Анализ", color: "blue", dot: "#3b82f6" },
  email_sent: { label: "Письмо отправлено", short: "Отправлено", color: "violet", dot: "#8b5cf6" },
  replied: { label: "Получен ответ", short: "Ответ", color: "cyan", dot: "#06b6d4" },
  negotiation: { label: "Переговоры", short: "Переговоры", color: "amber", dot: "#f59e0b" },
  client: { label: "Клиент", short: "Клиенты", color: "emerald", dot: "#10b981" },
  rejected: { label: "Отказ", short: "Отказы", color: "rose", dot: "#f43f5e" },
  blacklist: { label: "Чёрный список", short: "Blacklist", color: "zinc", dot: "#71717a" },
};

export const STATUS_ORDER = Object.keys(STATUS_META) as CRMStatus[];

export const SOURCE_META: Record<Source, { label: string; short: string }> = {
  yandex_maps: { label: "Яндекс Карты", short: "Яндекс" },
  openstreetmap: { label: "OpenStreetMap", short: "OSM" },
  google_maps: { label: "Google Maps", short: "Google" },
  "2gis": { label: "2ГИС", short: "2ГИС" },
  bing_maps: { label: "Bing Maps", short: "Bing" },
  manual: { label: "Вручную", short: "Manual" },
};

export const SERVICE_LABELS: Record<string, string> = {
  website: "Новый сайт",
  redesign: "Редизайн",
  seo: "SEO",
  ads: "Реклама",
  crm: "CRM",
  chatbot: "Чат-бот",
  automation: "Автоматизация",
  online_booking: "Онлайн-запись",
  whatsapp: "WhatsApp",
  ai_assistant: "AI-ассистент",
  analytics: "Аналитика",
};
