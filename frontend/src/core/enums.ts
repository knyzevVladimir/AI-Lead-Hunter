/**
 * Перечисления бэкенда и их представление в интерфейсе.
 *
 * Значения строк — контракт API, их менять нельзя. Всё, что рядом (подписи,
 * порядок, цвета, тон) — решения интерфейса и живут только здесь, чтобы
 * подпись статуса нигде не приходилось писать вручную второй раз.
 */

/* ------------------------------------------------------------------ */
/* Статус лида в воронке                                               */
/* ------------------------------------------------------------------ */

export const CRM_STATUSES = [
  "new",
  "analyzed",
  "email_sent",
  "replied",
  "negotiation",
  "client",
  "rejected",
  "blacklist",
] as const;

export type CRMStatus = (typeof CRM_STATUSES)[number];

/** Семантическая роль цвета — маппится на токены темы, а не на конкретный цвет. */
export type Tone =
  | "neutral"
  | "accent"
  | "ai"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface StatusMeta {
  label: string;
  short: string;
  tone: Tone;
  /** Описание для подсказок и пустых состояний колонок канбана. */
  hint: string;
  /** Считается ли лид активным в работе — для сводок и фильтра «в работе». */
  active: boolean;
}

export const CRM_STATUS_META: Record<CRMStatus, StatusMeta> = {
  new: {
    label: "Новый",
    short: "Новый",
    tone: "neutral",
    hint: "Найден, но ещё не проанализирован",
    active: true,
  },
  analyzed: {
    label: "Проанализирован",
    short: "Анализ",
    tone: "info",
    hint: "Есть оценка сайта и AI-скор, можно писать",
    active: true,
  },
  email_sent: {
    label: "Письмо отправлено",
    short: "Отправлено",
    tone: "accent",
    hint: "Первое касание сделано, ждём ответ",
    active: true,
  },
  replied: {
    label: "Ответил",
    short: "Ответ",
    tone: "ai",
    hint: "Клиент ответил — нужна реакция",
    active: true,
  },
  negotiation: {
    label: "Переговоры",
    short: "Переговоры",
    tone: "warning",
    hint: "Обсуждаем условия",
    active: true,
  },
  client: {
    label: "Клиент",
    short: "Клиент",
    tone: "success",
    hint: "Сделка закрыта",
    active: false,
  },
  rejected: {
    label: "Отказ",
    short: "Отказ",
    tone: "danger",
    hint: "Отказались от предложения",
    active: false,
  },
  blacklist: {
    label: "Чёрный список",
    short: "Блок",
    tone: "danger",
    hint: "Больше не связываемся",
    active: false,
  },
};

export const statusLabel = (s: string): string =>
  CRM_STATUS_META[s as CRMStatus]?.label ?? s;

export const statusTone = (s: string): Tone =>
  CRM_STATUS_META[s as CRMStatus]?.tone ?? "neutral";

/* ------------------------------------------------------------------ */
/* Источник данных                                                     */
/* ------------------------------------------------------------------ */

export const SOURCES = [
  "yandex_maps",
  "openstreetmap",
  "google_maps",
  "2gis",
  "bing_maps",
  "manual",
] as const;

export type Source = (typeof SOURCES)[number];

interface SourceMeta {
  label: string;
  /** Работает ли без API-ключа — показываем это прямо в выборе провайдера. */
  keyless: boolean;
  hint: string;
}

export const SOURCE_META: Record<Source, SourceMeta> = {
  yandex_maps: {
    label: "Яндекс Карты",
    keyless: true,
    hint: "Лучшее покрытие по России и СНГ. Работает без ключа",
  },
  openstreetmap: {
    label: "OpenStreetMap",
    keyless: true,
    hint: "Открытые данные, весь мир. Работает без ключа",
  },
  google_maps: {
    label: "Google Maps",
    keyless: false,
    hint: "Нужен GOOGLE_MAPS_API_KEY в настройках бэкенда",
  },
  "2gis": {
    label: "2ГИС",
    keyless: false,
    hint: "Нужен TWOGIS_API_KEY в настройках бэкенда",
  },
  bing_maps: {
    label: "Bing Maps",
    keyless: false,
    hint: "Парсер не подключён — запрос уйдёт в OpenStreetMap",
  },
  manual: {
    label: "Вручную",
    keyless: true,
    hint: "Парсер не подключён — запрос уйдёт в OpenStreetMap",
  },
};

/** Провайдеры, которые действительно стоит предлагать в UI по умолчанию. */
export const RECOMMENDED_SOURCES: Source[] = [
  "yandex_maps",
  "openstreetmap",
  "google_maps",
  "2gis",
];

/* ------------------------------------------------------------------ */
/* Состояние сайта                                                     */
/* ------------------------------------------------------------------ */

export const WEBSITE_STATUSES = ["ok", "none", "broken", "unreachable"] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const WEBSITE_STATUS_META: Record<
  WebsiteStatus,
  { label: string; tone: Tone; hint: string }
> = {
  ok: {
    label: "Сайт работает",
    tone: "success",
    hint: "Сайт доступен и отвечает",
  },
  none: {
    label: "Нет сайта",
    tone: "warning",
    hint: "Сайта нет вообще — самый частый повод для предложения",
  },
  broken: {
    label: "Сайт с ошибкой",
    tone: "danger",
    hint: "Сайт отвечает ошибкой",
  },
  unreachable: {
    label: "Сайт недоступен",
    tone: "danger",
    hint: "Таймаут или проблема с доменом",
  },
};

/* ------------------------------------------------------------------ */
/* Канал коммуникации                                                  */
/* ------------------------------------------------------------------ */

export const CHANNELS = [
  "email",
  "telegram",
  "whatsapp",
  "sms",
  "linkedin",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_META: Record<
  Channel,
  { label: string; /** Реализована ли реальная отправка на бэкенде. */ sendable: boolean }
> = {
  email: { label: "Email", sendable: true },
  telegram: { label: "Telegram", sendable: false },
  whatsapp: { label: "WhatsApp", sendable: false },
  sms: { label: "SMS", sendable: false },
  linkedin: { label: "LinkedIn", sendable: false },
};

/* ------------------------------------------------------------------ */
/* Статус сообщения                                                    */
/* ------------------------------------------------------------------ */

export const MESSAGE_STATUSES = [
  "draft",
  "queued",
  "sent",
  "replied",
  "failed",
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MESSAGE_STATUS_META: Record<
  MessageStatus,
  { label: string; tone: Tone }
> = {
  draft: { label: "Черновик", tone: "neutral" },
  queued: { label: "В очереди", tone: "info" },
  sent: { label: "Отправлено", tone: "accent" },
  replied: { label: "Есть ответ", tone: "success" },
  failed: { label: "Ошибка", tone: "danger" },
};

export const messageStatusLabel = (s: string): string =>
  MESSAGE_STATUS_META[s as MessageStatus]?.label ?? s;

export const messageStatusTone = (s: string): Tone =>
  MESSAGE_STATUS_META[s as MessageStatus]?.tone ?? "neutral";

/* ------------------------------------------------------------------ */
/* Услуги, которые можно предложить                                    */
/* ------------------------------------------------------------------ */

export const SERVICE_TYPES = [
  "website",
  "redesign",
  "seo",
  "ads",
  "crm",
  "chatbot",
  "automation",
  "online_booking",
  "whatsapp",
  "ai_assistant",
  "analytics",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  website: "Сайт с нуля",
  redesign: "Редизайн сайта",
  seo: "SEO-продвижение",
  ads: "Реклама",
  crm: "Внедрение CRM",
  chatbot: "Чат-бот",
  automation: "Автоматизация",
  online_booking: "Онлайн-запись",
  whatsapp: "WhatsApp-рассылки",
  ai_assistant: "AI-ассистент",
  analytics: "Аналитика",
};

export const serviceLabel = (s: string): string =>
  SERVICE_LABELS[s as ServiceType] ?? s;

/* ------------------------------------------------------------------ */
/* Проверки сайта                                                      */
/* ------------------------------------------------------------------ */

/**
 * Подписи технических проверок. Формулировки утвердительные («Есть HTTPS»),
 * потому что в интерфейсе они показываются с галочкой или крестом — двойное
 * отрицание вида «нет отсутствия HTTPS» читать невозможно.
 */
export const WEBSITE_CHECK_LABELS: Record<string, string> = {
  https: "HTTPS",
  mobile_friendly: "Мобильная версия",
  load_ms: "Скорость загрузки",
  modern_design: "Современный дизайн",
  online_booking: "Онлайн-запись",
  contact_form: "Форма заявки",
  has_map: "Карта на сайте",
  favicon: "Favicon",
  title: "Заголовок страницы",
  meta_description: "Meta description",
  h1: "Заголовок H1",
  seo: "Базовое SEO",
  robots_txt: "robots.txt",
  sitemap_xml: "sitemap.xml",
};

/** Порядок вывода проверок: сначала то, что важно для продажи. */
export const WEBSITE_CHECK_ORDER = [
  "https",
  "mobile_friendly",
  "modern_design",
  "online_booking",
  "contact_form",
  "load_ms",
  "seo",
  "meta_description",
  "h1",
  "title",
  "has_map",
  "favicon",
  "robots_txt",
  "sitemap_xml",
] as const;

/* ------------------------------------------------------------------ */
/* Соцсети                                                             */
/* ------------------------------------------------------------------ */

export const SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "vk",
  "telegram",
  "tiktok",
  "linkedin",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  vk: "VK",
  telegram: "Telegram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

/* ------------------------------------------------------------------ */
/* Шкала «температуры» лида                                            */
/* ------------------------------------------------------------------ */

export type ScoreTier = "cold" | "cool" | "warm" | "hot" | "blazing";

interface ScoreTierMeta {
  label: string;
  /** Что этот скор означает на языке продаж, а не «42 балла». */
  meaning: string;
  min: number;
}

export const SCORE_TIERS: Record<ScoreTier, ScoreTierMeta> = {
  cold: { label: "Холодный", meaning: "Всё в порядке — предлагать почти нечего", min: 0 },
  cool: { label: "Прохладный", meaning: "Есть мелкие недочёты", min: 25 },
  warm: { label: "Тёплый", meaning: "Заметные пробелы, есть о чём говорить", min: 45 },
  hot: { label: "Горячий", meaning: "Много слабых мест — хороший повод для оффера", min: 65 },
  blazing: { label: "Очень горячий", meaning: "Максимальный потенциал сделки", min: 80 },
};

export function scoreTier(score: number | null | undefined): ScoreTier | null {
  if (score === null || score === undefined) return null;
  if (score >= SCORE_TIERS.blazing.min) return "blazing";
  if (score >= SCORE_TIERS.hot.min) return "hot";
  if (score >= SCORE_TIERS.warm.min) return "warm";
  if (score >= SCORE_TIERS.cool.min) return "cool";
  return "cold";
}

/* ------------------------------------------------------------------ */
/* Цели экспорта в CRM                                                 */
/* ------------------------------------------------------------------ */

export const EXPORT_TARGETS = [
  "hubspot",
  "amocrm",
  "bitrix24",
  "notion",
  "google_sheets",
] as const;
export type ExportTarget = (typeof EXPORT_TARGETS)[number];

export const EXPORT_TARGET_LABELS: Record<ExportTarget, string> = {
  hubspot: "HubSpot",
  amocrm: "amoCRM",
  bitrix24: "Битрикс24",
  notion: "Notion",
  google_sheets: "Google Sheets",
};

export const EMAIL_PROVIDERS = ["smtp", "gmail", "outlook"] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export const EMAIL_PROVIDER_LABELS: Record<EmailProvider, string> = {
  smtp: "SMTP",
  gmail: "Gmail",
  outlook: "Outlook",
};

/* ------------------------------------------------------------------ */
/* Тон оффера                                                          */
/* ------------------------------------------------------------------ */

export const OFFER_TONES = ["professional", "friendly", "short"] as const;
export type OfferTone = (typeof OFFER_TONES)[number];

export const OFFER_TONE_META: Record<
  OfferTone,
  { label: string; hint: string }
> = {
  professional: {
    label: "Деловой",
    hint: "Сдержанный тон, обращение на «вы»",
  },
  friendly: {
    label: "Дружелюбный",
    hint: "Живая речь, меньше формальностей",
  },
  short: {
    label: "Короткий",
    hint: "Три-четыре строки, только суть",
  },
};
