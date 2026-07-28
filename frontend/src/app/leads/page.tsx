"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import {
  Search,
  Loader2,
  Download,
  Sparkles,
  Zap,
  Globe,
  Phone,
  Mail,
  Star,
  ExternalLink,
  Radar,
} from "lucide-react";
import {
  analyzeBatch,
  analyzeLead,
  exportCsvUrl,
  listLeads,
  searchBusinesses,
  type ListLeadsParams,
} from "@/lib/api";
import type { Company } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";
import StatusPill from "@/components/StatusPill";
import OfferModal from "@/components/OfferModal";

/* ---- Filter chip definitions (boolean listLeads params) ---- */
type BoolFilterKey =
  | "no_website"
  | "has_email"
  | "no_socials"
  | "low_rating"
  | "few_reviews"
  | "no_https"
  | "no_booking";

const FILTERS: { key: BoolFilterKey; label: string }[] = [
  { key: "no_website", label: "Без сайта" },
  { key: "has_email", label: "Есть Email" },
  { key: "no_socials", label: "Без соцсетей" },
  { key: "low_rating", label: "Рейтинг < 4" },
  { key: "few_reviews", label: "Мало отзывов" },
  { key: "no_https", label: "Без HTTPS" },
  { key: "no_booking", label: "Без онлайн-записи" },
];

const SOURCES = [
  { value: "yandex_maps", label: "Яндекс.Карты (без ключа)" },
  { value: "openstreetmap", label: "OpenStreetMap (без ключа)" },
  { value: "google_maps", label: "Google Maps (нужен ключ)" },
  { value: "2gis", label: "2ГИС (нужен ключ)" },
];

const LIMIT = 100;

export default function LeadsPage() {
  const queryClient = useQueryClient();

  // --- Search form state ---
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [searchLimit, setSearchLimit] = useState("50");
  const [source, setSource] = useState("yandex_maps");

  // --- Filter chips ---
  const [filters, setFilters] = useState<Record<BoolFilterKey, boolean>>({
    no_website: false,
    has_email: false,
    no_socials: false,
    low_rating: false,
    few_reviews: false,
    no_https: false,
    no_booking: false,
  });

  // --- Offer modal ---
  const [offerCompany, setOfferCompany] = useState<Company | null>(null);

  const listParams: ListLeadsParams = useMemo(() => {
    const active: ListLeadsParams = {
      sort_by_score: true,
      limit: LIMIT,
    };
    (Object.keys(filters) as BoolFilterKey[]).forEach((k) => {
      if (filters[k]) active[k] = true;
    });
    return active;
  }, [filters]);

  const leadsQuery = useQuery({
    queryKey: ["leads", listParams],
    queryFn: () => listLeads(listParams),
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // --- Mutations ---
  const searchMutation = useMutation({
    mutationFn: () =>
      searchBusinesses({
        query: query.trim(),
        city: city.trim() || undefined,
        radius_km: radiusKm ? Number(radiusKm) : undefined,
        limit: searchLimit ? Number(searchLimit) : undefined,
        source,
      }),
    onSuccess: refetchAll,
  });

  const batchMutation = useMutation({
    mutationFn: () => analyzeBatch(100, true),
    onSuccess: refetchAll,
  });

  const analyzeMutation = useMutation({
    mutationFn: (id: number) => analyzeLead(id),
    onSuccess: refetchAll,
  });

  const toggleFilter = (key: BoolFilterKey) =>
    setFilters((f) => ({ ...f, [key]: !f[key] }));

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate();
  };

  const csvHref = exportCsvUrl(listParams);
  const items = leadsQuery.data?.items ?? [];
  const total = leadsQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Поиск и лиды</h1>
        <p className="page-subtitle">
          Найдите локальный бизнес, отфильтруйте по слабым местам и запустите
          анализ.
        </p>
      </div>

      {/* Search panel */}
      <form onSubmit={onSearch} className="card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="label">Категория / ключевые слова</label>
            <input
              className="input"
              placeholder="напр. барбершоп, стоматология…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <label className="label">Город</label>
            <input
              className="input"
              placeholder="Москва"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="label">Радиус, км</label>
            <input
              className="input"
              type="number"
              min={0}
              placeholder="10"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="label">Лимит</label>
            <input
              className="input"
              type="number"
              min={1}
              value={searchLimit}
              onChange={(e) => setSearchLimit(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="label">Источник</label>
            <select
              className="input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={searchMutation.isPending || !query.trim()}
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Ищем…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Найти
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => batchMutation.mutate()}
            disabled={batchMutation.isPending}
          >
            {batchMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Анализ…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Проанализировать всех
              </>
            )}
          </button>

          <a
            href={csvHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            <Download className="h-4 w-4" /> Экспорт CSV
          </a>

          {searchMutation.isSuccess && (
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Найдено {searchMutation.data?.found ?? 0}, сохранено{" "}
              {searchMutation.data?.saved ?? 0} компаний
            </span>
          )}
          {searchMutation.isError && (
            <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
              {(searchMutation.error as Error)?.message}
            </span>
          )}
          {batchMutation.isSuccess && (
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Проанализировано: {batchMutation.data?.analyzed ?? 0}
            </span>
          )}
        </div>

        {/* Filter chips */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Фильтры
          </span>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleFilter(f.key)}
              className={filters[f.key] ? "chip-on" : "chip-off"}
            >
              {f.label}
            </button>
          ))}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setFilters((f) =>
                  Object.fromEntries(
                    Object.keys(f).map((k) => [k, false])
                  ) as Record<BoolFilterKey, boolean>
                )
              }
              className="text-xs font-medium text-brand-500 hover:text-brand-600"
            >
              Сбросить ({activeFilterCount})
            </button>
          )}
        </div>
      </form>

      {/* Results */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            Лиды{" "}
            <span className="ml-1 font-normal text-muted">
              {leadsQuery.isLoading ? "…" : `(${total})`}
            </span>
          </h2>
          {leadsQuery.isFetching && !leadsQuery.isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-faint" />
          )}
        </div>

        <LeadsTable
          items={items}
          loading={leadsQuery.isLoading}
          error={leadsQuery.isError}
          analyzingId={
            analyzeMutation.isPending
              ? (analyzeMutation.variables as number)
              : null
          }
          onAnalyze={(id) => analyzeMutation.mutate(id)}
          onOffer={(c) => setOfferCompany(c)}
        />
      </section>

      {offerCompany && (
        <OfferModal
          companyId={offerCompany.id}
          companyName={offerCompany.name}
          onClose={() => setOfferCompany(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LeadsTable({
  items,
  loading,
  error,
  analyzingId,
  onAnalyze,
  onOffer,
}: {
  items: Company[];
  loading: boolean;
  error: boolean;
  analyzingId: number | null;
  onAnalyze: (id: number) => void;
  onOffer: (c: Company) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-11 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm text-rose-600">
        Не удалось загрузить лиды. Проверьте, что backend запущен.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <Radar className="h-6 w-6 text-faint" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Список пуст</p>
          <p className="mt-0.5 text-xs text-muted">
            Запустите поиск выше или снимите фильтры.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-slate-50/60">
            <th className="th">Компания</th>
            <th className="th">Категория</th>
            <th className="th">Город</th>
            <th className="th">Контакты</th>
            <th className="th">Рейтинг</th>
            <th className="th">AI Score</th>
            <th className="th">Статус</th>
            <th className="th text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => {
            const analyzing = analyzingId === c.id;
            return (
              <tr
                key={c.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-slate-50/70"
              >
                {/* Company + website */}
                <td className="td">
                  <div className="font-medium text-ink">{c.name}</div>
                  {c.website ? (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                    >
                      <Globe className="h-3 w-3" />
                      {shortUrl(c.website)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-rose-500">
                      нет сайта
                    </span>
                  )}
                </td>

                <td className="td text-muted">{c.category ?? "—"}</td>
                <td className="td text-muted">{c.city ?? "—"}</td>

                {/* Contacts */}
                <td className="td">
                  <div className="flex items-center gap-2">
                    <Phone
                      className={clsx(
                        "h-4 w-4",
                        c.phone ? "text-teal-600" : "text-slate-200"
                      )}
                    />
                    <Mail
                      className={clsx(
                        "h-4 w-4",
                        c.email ? "text-cyan-600" : "text-slate-200"
                      )}
                    />
                  </div>
                </td>

                {/* Rating */}
                <td className="td">
                  {c.rating != null ? (
                    <div className="flex items-center gap-1 text-ink">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="tabular-nums">
                        {c.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted">
                        ({c.reviews_count ?? 0})
                      </span>
                    </div>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>

                {/* Score */}
                <td className="td">
                  <ScoreBadge score={c.ai_score} />
                </td>

                {/* Status */}
                <td className="td">
                  <StatusPill status={c.status} />
                </td>

                {/* Actions */}
                <td className="td">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onAnalyze(c.id)}
                      disabled={analyzing}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {analyzing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      Анализ
                    </button>
                    <button
                      onClick={() => onOffer(c)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Предложение
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}
