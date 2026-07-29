"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, CircleGauge, Globe2, MapPin, Radar, Search, SlidersHorizontal, Sparkles, Star, Target } from "lucide-react";
import { FilterButton } from "@/components/search/filter-button";
import { SearchHistory, saveSearchHistory, type SearchHistoryItem } from "@/components/search/search-history";
import { SearchResultCard } from "@/components/search/search-result-card";
import { SearchResultsSkeleton } from "@/components/search/search-skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Popover } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { SOURCE_META } from "@/theme/constants";
import type { Source } from "@/types/domain";

const SUGGESTIONS = ["Стоматологии", "Салоны красоты", "Автосервисы", "Рестораны", "Фитнес-клубы"];
const SOURCES: Source[] = ["yandex_maps", "openstreetmap", "google_maps", "2gis"];

export default function SearchPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(15);
  const [limit, setLimit] = useState(50);
  const [source, setSource] = useState<Source>("yandex_maps");
  const [noWebsite, setNoWebsite] = useState(false);
  const [noEmail, setNoEmail] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minScore, setMinScore] = useState(0);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const summary = await api.search({ query: query.trim(), city: city.trim() || undefined, radius_km: radius, limit, source });
      const companies = await api.getLeadsByIds(summary.company_ids);
      return { summary, companies };
    },
    onSuccess: ({ summary }) => {
      saveSearchHistory({ query: query.trim(), city: city.trim() });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast({ title: "Поиск завершён", description: `Найдено ${summary.found}, сохранено ${summary.saved} компаний.`, tone: "success" });
    },
    onError: (error) => toast({ title: "Поиск не выполнен", description: (error as Error).message, tone: "error" }),
  });

  const results = useMemo(() => (searchMutation.data?.companies ?? []).filter((company) => {
    if (noWebsite && company.website) return false;
    if (noEmail && company.email) return false;
    if (minRating > 0 && (company.rating ?? 0) < minRating) return false;
    if (minScore > 0 && (company.ai_score ?? 0) < minScore) return false;
    return true;
  }), [searchMutation.data, noWebsite, noEmail, minRating, minScore]);

  const activeFilters = [Boolean(city), radius !== 15, noWebsite, noEmail, minRating > 0, minScore > 0, source !== "yandex_maps"].filter(Boolean).length;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim() || searchMutation.isPending) return;
    searchMutation.mutate();
  };
  const selectHistory = (item: SearchHistoryItem) => { setQuery(item.query); setCity(item.city); };
  const resetFilters = () => { setCity(""); setRadius(15); setNoWebsite(false); setNoEmail(false); setMinRating(0); setMinScore(0); setSource("yandex_maps"); };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Lead discovery" title="Поиск компаний" description="Находите локальный бизнес из карт и справочников, затем сразу оценивайте цифровой потенциал." actions={<Link href="/leads" className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:border-slate-300"><Building2 className="h-3.5 w-3.5" />Открыть базу лидов</Link>} />

      <section className="relative overflow-visible rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_42px_rgba(15,23,42,.05)] sm:p-6">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,.08),transparent_70%)]" />
        <form onSubmit={submit} className="relative">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Например, стоматологии или барбершопы…" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-medium text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" /></div>
            <Button type="submit" size="lg" className="h-14 rounded-2xl px-6 text-sm" loading={searchMutation.isPending} disabled={!query.trim()}><Radar className="h-4 w-4" />Найти компании</Button>
          </div>

          <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center gap-2">
            <Popover trigger={<button type="button"><FilterButton icon={<MapPin className="h-3.5 w-3.5" />} label="Локация" value={city || `${radius} км`} active={Boolean(city) || radius !== 15} /></button>} className="w-[310px] p-4">
              <Label>Город</Label><Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Москва" />
              <div className="mt-4 flex items-center justify-between"><Label className="mb-0">Радиус поиска</Label><span className="text-xs font-semibold text-violet-700">{radius} км</span></div>
              <input type="range" min={1} max={100} value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-3 w-full accent-violet-600" />
            </Popover>

            <Popover trigger={<button type="button"><FilterButton icon={<Globe2 className="h-3.5 w-3.5" />} label="Цифровое присутствие" active={noWebsite || noEmail} /></button>} className="w-[280px] p-2">
              <ToggleRow label="Без сайта" description="Показывать компании без URL" checked={noWebsite} onChange={setNoWebsite} />
              <ToggleRow label="Без email" description="Нет публичного адреса" checked={noEmail} onChange={setNoEmail} />
            </Popover>

            <Popover trigger={<button type="button"><FilterButton icon={<Star className="h-3.5 w-3.5" />} label="Рейтинг" value={minRating ? `${minRating}+` : undefined} active={minRating > 0} /></button>} className="w-[280px] p-4">
              <div className="flex items-center justify-between"><Label className="mb-0">Минимальный рейтинг</Label><span className="text-xs font-semibold text-violet-700">{minRating || "Любой"}</span></div>
              <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="mt-4 w-full accent-violet-600" />
            </Popover>

            <Popover trigger={<button type="button"><FilterButton icon={<CircleGauge className="h-3.5 w-3.5" />} label="AI Score" value={minScore ? `${minScore}+` : undefined} active={minScore > 0} /></button>} className="w-[280px] p-4">
              <div className="flex items-center justify-between"><Label className="mb-0">Минимальный AI Score</Label><span className="text-xs font-semibold text-violet-700">{minScore || "Любой"}</span></div>
              <input type="range" min={0} max={100} step={5} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} className="mt-4 w-full accent-violet-600" />
            </Popover>

            <Popover trigger={<button type="button"><FilterButton icon={<Target className="h-3.5 w-3.5" />} label="Источник" value={SOURCE_META[source].short} active={source !== "yandex_maps"} /></button>} align="end" className="w-[280px] p-2">
              {SOURCES.map((item) => <button type="button" key={item} onClick={() => setSource(item)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"><span className="flex-1">{SOURCE_META[item].label}</span>{source === item && <Check className="h-4 w-4 text-violet-600" />}</button>)}
            </Popover>

            <Popover trigger={<button type="button"><FilterButton icon={<SlidersHorizontal className="h-3.5 w-3.5" />} label="Лимит" value={`${limit}`} active={limit !== 50} /></button>} align="end" className="w-[220px] p-4">
              <Label>Компаний в выдаче</Label><Select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[25, 50, 100, 250, 500].map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </Popover>

            {activeFilters > 0 && <button type="button" onClick={resetFilters} className="ml-1 text-xs font-medium text-slate-400 hover:text-slate-800">Сбросить · {activeFilters}</button>}
          </div>

          <div className="mx-auto mt-4 flex max-w-4xl flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchHistory onSelect={selectHistory} />
            <div className="flex flex-wrap items-center gap-1.5">{SUGGESTIONS.map((suggestion) => <button type="button" key={suggestion} onClick={() => setQuery(suggestion)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">{suggestion}</button>)}</div>
          </div>
        </form>
      </section>

      {searchMutation.isPending && <SearchResultsSkeleton />}
      {searchMutation.isError && <div className="rounded-2xl border border-slate-200 bg-white"><ErrorState title="Поиск не выполнен" message={(searchMutation.error as Error).message} onRetry={() => searchMutation.mutate()} /></div>}
      {searchMutation.isSuccess && (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">Результаты поиска <span className="ml-1 font-normal text-slate-400">{results.length}</span></p><p className="mt-0.5 text-xs text-slate-400">Источник нашёл {searchMutation.data.summary.found}; в базу добавлено {searchMutation.data.summary.saved}.</p></div>{results.length < searchMutation.data.companies.length && <p className="text-[11px] text-violet-600">{searchMutation.data.companies.length - results.length} скрыто активными фильтрами</p>}</div>
          {results.length ? <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{results.map((company) => <SearchResultCard key={company.id} company={company} />)}</div> : <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Sparkles} title="Подходящих компаний нет" description="Поиск завершён, но активные фильтры скрывают результаты. Сбросьте ограничения или измените запрос." action={<Button variant="secondary" size="sm" onClick={resetFilters}>Сбросить фильтры</Button>} /></div>}
        </section>
      )}
      {!searchMutation.isIdle && searchMutation.isSuccess && results.length > 0 && <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-center text-sm text-violet-800"><Sparkles className="mr-2 inline h-4 w-4" />Компании сохранены в общей базе. Перейдите в <Link href="/leads" className="font-semibold underline underline-offset-2">Лиды</Link>, чтобы запустить массовый AI-анализ.</div>}
      {searchMutation.isIdle && <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60"><EmptyState icon={Target} title="Начните с категории бизнеса" description="Укажите нишу и город. Поиск использует подключённый источник и сохраняет найденные компании в вашу базу." /></div>}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-700">{label}</p><p className="mt-0.5 text-[10px] text-slate-400">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} label={label} /></div>;
}
