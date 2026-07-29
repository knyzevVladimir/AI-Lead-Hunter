import type { Company } from "@/types/domain";

export interface NamedValue { name: string; value: number }
export interface DailyPoint { date: string; label: string; leads: number; analyzed: number }

function dayKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isToday(value: string) {
  return dayKey(value) === dayKey(new Date());
}

export function averageScore(items: Company[]) {
  const values = items.map((item) => item.ai_score).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function countInWindow(items: Company[], startDaysAgo: number, endDaysAgo = 0) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - endDaysAgo);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - startDaysAgo);
  return items.filter((item) => {
    const date = new Date(item.created_at);
    return date >= start && date <= end;
  }).length;
}

export function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function dailySeries(items: Company[], days = 30): DailyPoint[] {
  const created = new Map<string, number>();
  const analyzed = new Map<string, number>();
  items.forEach((item) => {
    created.set(dayKey(item.created_at), (created.get(dayKey(item.created_at)) ?? 0) + 1);
    if (item.last_checked_at) analyzed.set(dayKey(item.last_checked_at), (analyzed.get(dayKey(item.last_checked_at)) ?? 0) + 1);
  });
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    const key = dayKey(date);
    return {
      date: key,
      label: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date),
      leads: created.get(key) ?? 0,
      analyzed: analyzed.get(key) ?? 0,
    };
  });
}

export function groupCount(items: Company[], selector: (item: Company) => string | null | undefined, limit = 8): NamedValue[] {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = selector(item)?.trim() || "Не указано";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function heatmapDays(items: Company[], days = 77) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(dayKey(item.created_at), (counts.get(dayKey(item.created_at)) ?? 0) + 1));
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    return { date, key: dayKey(date), value: counts.get(dayKey(date)) ?? 0 };
  });
  const max = Math.max(1, ...points.map((point) => point.value));
  return points.map((point) => ({ ...point, intensity: point.value / max }));
}

export function inferRegion(item: Company) {
  if (item.country && item.city) return item.country;
  return item.country || "Не указано";
}
