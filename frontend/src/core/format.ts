/**
 * Форматирование данных для интерфейса. Без React-зависимостей.
 */

/* ------------------------------------------------------------------ */
/* Числа                                                              */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat("ru-RU");

export const num = (n: number | null | undefined): string =>
  n === null || n === undefined ? "—" : nf.format(n);

/** Компактная запись для метрик: 1 240 → 1,2 тыс. */
export function compactNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) < 1000) return nf.format(n);
  return new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export const percent = (n: number | null | undefined, digits = 1): string =>
  n === null || n === undefined ? "—" : `${n.toFixed(digits).replace(".", ",")}%`;

export const rating = (r: number | null | undefined): string =>
  r === null || r === undefined ? "—" : r.toFixed(1).replace(".", ",");

/**
 * Русская форма слова по числу: plural(5, 'компания', 'компании', 'компаний').
 */
export function plural(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

/** «12 компаний» — число вместе с согласованным словом. */
export const pluralize = (
  n: number,
  one: string,
  few: string,
  many: string,
): string => `${nf.format(n)} ${plural(n, one, few, many)}`;

export const leadsWord = (n: number) => plural(n, "лид", "лида", "лидов");
export const companiesWord = (n: number) =>
  plural(n, "компания", "компании", "компаний");

/* ------------------------------------------------------------------ */
/* Время                                                              */
/* ------------------------------------------------------------------ */

const dtf = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dtfTime = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const date = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? dtf.format(d) : "—";
};

export const dateTime = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? dtfTime.format(d) : "—";
};

/**
 * Относительное время: «5 минут назад», «вчера».
 * Свежесть данных в этом продукте важнее точной даты — цифры карт устаревают.
 */
export function relTime(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return "—";

  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);

  if (sec < 45) return "только что";
  const min = Math.round(sec / 60);
  if (min < 60) return `${pluralize(min, "минуту", "минуты", "минут")} назад`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${pluralize(hrs, "час", "часа", "часов")} назад`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${pluralize(days, "день", "дня", "дней")} назад`;
  if (days < 31) {
    const weeks = Math.round(days / 7);
    return `${pluralize(weeks, "неделю", "недели", "недель")} назад`;
  }
  return date(iso);
}

/** Длительность в человекочитаемом виде: для прогресса поиска. */
export function duration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m} мин ${rest} с` : `${m} мин`;
}

/* ------------------------------------------------------------------ */
/* Строки и контакты                                                  */
/* ------------------------------------------------------------------ */

/** Домен без схемы и www — в таблице нужен только он. */
export function websiteHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0] ?? url;
  }
}

export function ensureUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Телефон в читаемом виде, но без агрессивной перезаписи неизвестных форматов. */
export function phone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  return raw.trim();
}

export const telHref = (raw: string | null | undefined): string | null =>
  raw ? `tel:${raw.replace(/[^\d+]/g, "")}` : null;

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

/** Инициалы для аватара компании. */
export function initials(name: string): string {
  const words = name
    .replace(/["«»'`]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && /\p{L}|\p{N}/u.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}

/**
 * Устойчивый индекс цвета по строке — чтобы аватар компании имел один и тот же
 * оттенок между сессиями без хранения этого в базе.
 */
export function hashIndex(s: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % buckets;
}

/* ------------------------------------------------------------------ */
/* География                                                          */
/* ------------------------------------------------------------------ */

/** Короткая строка местоположения: город плюс улица без повторов. */
export function locationLine(c: {
  city: string | null;
  address: string | null;
}): string {
  const { city, address } = c;
  if (!address) return city ?? "—";
  if (!city) return address;
  // Адрес от провайдеров часто уже содержит город — не дублируем.
  return address.toLowerCase().includes(city.toLowerCase())
    ? address
    : `${city}, ${address}`;
}

export const hasCoords = (c: {
  lat: number | null;
  lng: number | null;
}): boolean => c.lat !== null && c.lng !== null;
