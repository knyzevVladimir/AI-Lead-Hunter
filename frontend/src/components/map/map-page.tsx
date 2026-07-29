"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Globe2, ListFilter, Map as MapIcon, MapPin, Search, X } from "lucide-react";
import { MapCompanyCard } from "@/components/map/map-company-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input, Label } from "@/components/ui/input";
import { Popover } from "@/components/ui/popover";
import { ScoreRing } from "@/components/ui/score-ring";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import type { Company, CRMStatus } from "@/types/domain";
import { cn } from "@/utils/cn";

const MapCanvas = dynamic(() => import("@/components/map/map-canvas").then((module) => module.MapCanvas), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });
type GeoCompany = Company & { lat: number; lng: number };

export default function MapPage() {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [noWebsite, setNoWebsite] = useState(false);
  const [monitored, setMonitored] = useState(false);
  const [status, setStatus] = useState<CRMStatus | "all">("all");
  const [selected, setSelected] = useState<Company | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const leadsQuery = useQuery({ queryKey: queryKeys.leads.list({ limit: 500, sort_by_score: true }), queryFn: () => api.listLeads({ limit: 500, sort_by_score: true }) });

  const allGeo = useMemo(() => (leadsQuery.data?.items ?? []).filter((company): company is GeoCompany => typeof company.lat === "number" && typeof company.lng === "number"), [leadsQuery.data]);
  const normalized = search.toLocaleLowerCase("ru").trim();
  const companies = useMemo(() => allGeo.filter((company) => {
    if (normalized && ![company.name, company.category, company.city, company.address].some((value) => value?.toLocaleLowerCase("ru").includes(normalized))) return false;
    if (minScore && (company.ai_score ?? 0) < minScore) return false;
    if (noWebsite && company.website) return false;
    if (monitored && !company.monitored) return false;
    if (status !== "all" && company.status !== status) return false;
    return true;
  }), [allGeo, normalized, minScore, noWebsite, monitored, status]);
  const activeFilters = [minScore > 0, noWebsite, monitored, status !== "all"].filter(Boolean).length;
  const reset = () => { setMinScore(0); setNoWebsite(false); setMonitored(false); setStatus("all"); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-violet-600">Geospatial intelligence</p><h1 className="mt-1 text-[26px] font-semibold tracking-[-.035em] text-slate-950">Карта лидов</h1></div><div className="flex flex-wrap items-center gap-2"><Badge tone="rose" dot>{companies.filter((company) => !company.website).length} без сайта</Badge><Badge tone="violet" dot>{companies.filter((company) => (company.ai_score ?? 0) >= 70).length} с AI 70+</Badge><Badge tone="cyan" dot>{companies.filter((company) => company.monitored).length} в мониторинге</Badge></div></div>

      <div className="relative h-[calc(100vh-160px)] min-h-[620px] overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100 shadow-[0_12px_38px_rgba(15,23,42,.06)]">
        {leadsQuery.isLoading ? <Skeleton className="h-full w-full rounded-none" /> : leadsQuery.isError ? <div className="absolute inset-0 flex items-center justify-center bg-white"><ErrorState message={(leadsQuery.error as Error).message} onRetry={() => leadsQuery.refetch()} /></div> : allGeo.length === 0 ? <div className="absolute inset-0 flex items-center justify-center bg-white"><EmptyState icon={MapIcon} title="Нет лидов с координатами" description="Выполните поиск компаний, чтобы добавить географические данные." /></div> : <MapCanvas companies={companies} selectedId={selected?.id ?? null} onSelect={setSelected} />}

        <div className="absolute left-3 right-3 top-3 z-[500] flex items-start gap-2 sm:left-4 sm:right-auto">
          <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск на карте…" className="h-10 bg-white/95 pl-9 shadow-[0_8px_24px_rgba(15,23,42,.12)] backdrop-blur" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>}</div>
          <Popover trigger={<Button variant={activeFilters ? "primary" : "secondary"} size="icon" className="bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,.12)]"><Filter className="h-4 w-4" /></Button>} className="w-[300px] p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Фильтры карты</p>{activeFilters > 0 && <button type="button" onClick={reset} className="text-[11px] font-medium text-violet-600">Сбросить {activeFilters}</button>}</div>
            <div className="mt-4"><div className="flex items-center justify-between"><Label className="mb-0">Минимальный AI Score</Label><span className="text-xs font-semibold text-violet-700">{minScore || "Любой"}</span></div><input type="range" min={0} max={100} step={5} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} className="mt-3 w-full accent-violet-600" /></div>
            <div className="mt-4"><Label>CRM статус</Label><Select value={status} onChange={(event) => setStatus(event.target.value as CRMStatus | "all")}><option value="all">Все статусы</option>{STATUS_ORDER.map((item) => <option key={item} value={item}>{STATUS_META[item].label}</option>)}</Select></div>
            <div className="mt-3 space-y-1"><ToggleFilter label="Только без сайта" checked={noWebsite} onChange={setNoWebsite} /><ToggleFilter label="Только в мониторинге" checked={monitored} onChange={setMonitored} /></div>
          </Popover>
          <Button variant="secondary" size="icon" className="bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,.12)]" onClick={() => setListOpen(!listOpen)} aria-label="Показать список"><ListFilter className="h-4 w-4" /></Button>
        </div>

        {listOpen && <aside className="absolute bottom-3 left-3 top-[66px] z-[450] flex w-[min(330px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,.16)] backdrop-blur sm:bottom-4 sm:left-4 sm:top-[68px]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-xs font-semibold text-slate-800">Компании рядом</p><p className="text-[10px] text-slate-400">{companies.length} из {allGeo.length} на карте</p></div><button type="button" onClick={() => setListOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button></div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">{companies.slice(0, 100).map((company) => <button type="button" key={company.id} onClick={() => setSelected(company)} className={cn("flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-50", selected?.id === company.id && "bg-violet-50/80")}><Avatar name={company.name} size="md" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{company.name}</p><p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-400"><MapPin className="h-3 w-3" />{company.city || company.address || "Без адреса"}</p></div><ScoreRing score={company.ai_score} size="sm" /></button>)}</div>
        </aside>}

        {selected && <div className="absolute bottom-4 right-4 z-[500] hidden w-[320px] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_18px_54px_rgba(15,23,42,.2)] backdrop-blur md:block"><button type="button" onClick={() => setSelected(null)} className="absolute right-3 top-3 z-10 rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button><MapCompanyCard company={selected} /></div>}
        <div className="absolute bottom-4 right-4 z-[400] flex items-center gap-3 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[10px] text-slate-500 shadow-lg backdrop-blur md:bottom-auto md:right-4 md:top-4"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" />Нет сайта</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-500" />AI 70+</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />Сайт</span></div>
      </div>

      {selected && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white md:hidden"><MapCompanyCard company={selected} /></div>}
    </div>
  );
}

function ToggleFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center gap-3 rounded-lg px-1 py-2"><span className="flex-1 text-xs font-medium text-slate-600">{label}</span><Switch checked={checked} onCheckedChange={onChange} label={label} /></div>;
}
