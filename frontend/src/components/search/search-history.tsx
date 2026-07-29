"use client";

import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";

export interface SearchHistoryItem { query: string; city: string; timestamp: number }
const STORAGE_KEY = "ailh:search-history";

export function readSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SearchHistoryItem[]; } catch { return []; }
}

export function saveSearchHistory(item: Omit<SearchHistoryItem, "timestamp">) {
  const current = readSearchHistory().filter((entry) => !(entry.query === item.query && entry.city === item.city));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...item, timestamp: Date.now() }, ...current].slice(0, 6)));
}

export function SearchHistory({ onSelect }: { onSelect: (item: SearchHistoryItem) => void }) {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  useEffect(() => setItems(readSearchHistory()), []);
  if (!items.length) return null;
  const clear = () => { localStorage.removeItem(STORAGE_KEY); setItems([]); };
  return <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Clock3 className="h-3 w-3" />Недавние</span>{items.map((item) => <button key={`${item.query}-${item.city}`} type="button" onClick={() => onSelect(item)} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-200 hover:text-slate-800">{item.query}{item.city ? ` · ${item.city}` : ""}</button>)}<button type="button" onClick={clear} className="rounded-full p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600" aria-label="Очистить историю"><X className="h-3 w-3" /></button></div>;
}
