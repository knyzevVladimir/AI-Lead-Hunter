"use client";

import { Download, Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import type { CRMStatus } from "@/types/domain";

export interface LeadsFilters {
  search: string;
  category: string;
  city: string;
  status: CRMStatus | "all";
  minScore: number;
  noWebsite: boolean;
  hasEmail: boolean;
  noSocials: boolean;
  noHttps: boolean;
  noBooking: boolean;
  monitored: boolean;
  sort: "score" | "recent";
}

export const DEFAULT_LEADS_FILTERS: LeadsFilters = { search: "", category: "", city: "", status: "all", minScore: 0, noWebsite: false, hasEmail: false, noSocials: false, noHttps: false, noBooking: false, monitored: false, sort: "score" };

export function LeadsToolbar({ filters, onChange, onAnalyzeAll, analyzeLoading, exportUrl }: { filters: LeadsFilters; onChange: (filters: LeadsFilters) => void; onAnalyzeAll: () => void; analyzeLoading: boolean; exportUrl: string }) {
  const patch = <K extends keyof LeadsFilters>(key: K, value: LeadsFilters[K]) => onChange({ ...filters, [key]: value });
  const active = [filters.category, filters.city, filters.status !== "all", filters.minScore > 0, filters.noWebsite, filters.hasEmail, filters.noSocials, filters.noHttps, filters.noBooking, filters.monitored].filter(Boolean).length;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={filters.search} onChange={(event) => patch("search", event.target.value)} placeholder="Компания, категория, город или адрес…" className="pl-9" />{filters.search && <button type="button" onClick={() => patch("search", "")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover trigger={<Button variant={active ? "primary" : "secondary"} size="md"><Filter className="h-4 w-4" />Фильтры{active > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[10px]">{active}</span>}</Button>} align="end" className="w-[min(380px,calc(100vw-2rem))] p-4">
            <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-900">Фильтры лидов</p><p className="text-[10px] text-slate-400">Сужайте базу по коммерческому потенциалу</p></div>{active > 0 && <button type="button" onClick={() => onChange({ ...DEFAULT_LEADS_FILTERS, search: filters.search, sort: filters.sort })} className="text-[11px] font-medium text-violet-600">Сбросить</button>}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><Label>Категория</Label><Input value={filters.category} onChange={(event) => patch("category", event.target.value)} placeholder="dentist" /></div><div><Label>Город</Label><Input value={filters.city} onChange={(event) => patch("city", event.target.value)} placeholder="Москва" /></div></div>
            <div className="mt-3"><Label>CRM статус</Label><Select value={filters.status} onChange={(event) => patch("status", event.target.value as LeadsFilters["status"])}><option value="all">Все статусы</option>{STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</Select></div>
            <div className="mt-4"><div className="flex items-center justify-between"><Label className="mb-0">Минимальный AI Score</Label><span className="text-xs font-semibold text-violet-700">{filters.minScore || "Любой"}</span></div><input type="range" min={0} max={100} step={5} value={filters.minScore} onChange={(event) => patch("minScore", Number(event.target.value))} className="mt-3 w-full accent-violet-600" /></div>
            <div className="mt-4 grid gap-1 sm:grid-cols-2"><FilterToggle label="Без сайта" checked={filters.noWebsite} onChange={(value) => patch("noWebsite", value)} /><FilterToggle label="Есть email" checked={filters.hasEmail} onChange={(value) => patch("hasEmail", value)} /><FilterToggle label="Без соцсетей" checked={filters.noSocials} onChange={(value) => patch("noSocials", value)} /><FilterToggle label="Без HTTPS" checked={filters.noHttps} onChange={(value) => patch("noHttps", value)} /><FilterToggle label="Без онлайн-записи" checked={filters.noBooking} onChange={(value) => patch("noBooking", value)} /><FilterToggle label="В мониторинге" checked={filters.monitored} onChange={(value) => patch("monitored", value)} /></div>
          </Popover>
          <div className="relative"><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><Select value={filters.sort} onChange={(event) => patch("sort", event.target.value as LeadsFilters["sort"])} className="w-44 pl-8"><option value="score">Сначала AI Score</option><option value="recent">Сначала новые</option></Select></div>
          <Button variant="secondary" onClick={onAnalyzeAll} loading={analyzeLoading}><Sparkles className="h-4 w-4" />Анализировать</Button>
          <a href={exportUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"><Download className="h-4 w-4" />CSV</a>
        </div>
      </div>
    </div>
  );
}

function FilterToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"><span className="flex-1 text-xs font-medium text-slate-600">{label}</span><Switch checked={checked} onCheckedChange={onChange} label={label} /></div>;
}
