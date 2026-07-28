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
  X,
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
import StatusPill from "@/components/StatusPill";
import OfferModal from "@/components/OfferModal";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import Reveal from "@/components/motion/Reveal";
import ScoreRing from "@/components/charts/ScoreRing";

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

  /* --- Search form state --- */
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [searchLimit, setSearchLimit] = useState("50");
  const [source, setSource] = useState("yandex_maps");

  /* --- Filter chips --- */
  const [filters, setFilters] = useState<Record<BoolFilterKey, boolean>>({
    no_website: false,
    has_email: false,
    no_socials: false,
    low_rating: false,
    few_reviews: false,
    no_https: false,
    no_booking: false,
  });

  /* --- Offer modal --- */
  const [offerCompany, setOfferCompany] = useState<Company | null>(null);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

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

  /* --- Mutations --- */
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

  /* Reset all filters at once — shown only when ≥1 is active */
  const resetFilters = () =>
    setFilters({
      no_website: false,
      has_email: false,
      no_socials: false,
      low_rating: false,
      few_reviews: false,
      no_https: false,
      no_booking: false,
    });

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
      {/* ── Page header ── */}
      <Reveal from="down" duration={500}>
        <p className="eyebrow mb-1">Targeting Console</p>
        <div className="flex items-baseline gap-3">
          <h1 className="page-title">Поиск и лиды</h1>
          <span className="text-sm text-muted">
            {leadsQuery.isLoading ? (
              <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <AnimatedNumber
                  value={total}
                  className="font-semibold text-white/80"
                />
                {" результатов"}
              </>
            )}
          </span>
        </div>
        <p className="page-subtitle mt-1">
          Найдите локальный бизнес, отфильтруйте по слабым местам и запустите
          анализ.
        </p>
      </Reveal>

      {/* ── Search panel ── */}
      {/* ring-gradient wraps the card to give it a glowing hairline border. */}
      <Reveal from="up" delay={60} duration={500}>
        <form
          onSubmit={onSearch}
          className={clsx(
            "card ring-gradient p-5",
            /* Focus-within glow communicates that the form is active. */
            "transition-shadow duration-300 focus-within:shadow-glow"
          )}
        >
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
                  <option key={s.value} value={s.value} className="bg-panel">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions row */}
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

            {/* Inline status pills — scale-in so they feel like system events. */}
            {searchMutation.isSuccess && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full",
                  "border border-green-500/30 bg-green-500/10",
                  "px-3 py-1 text-xs font-medium text-green-300",
                  "animate-scale-in"
                )}
              >
                Найдено {searchMutation.data?.found ?? 0}, сохранено{" "}
                {searchMutation.data?.saved ?? 0} компаний
              </span>
            )}
            {searchMutation.isError && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full",
                  "border border-red-500/30 bg-red-500/10",
                  "px-3 py-1 text-xs font-medium text-red-300",
                  "animate-scale-in"
                )}
              >
                {(searchMutation.error as Error)?.message}
              </span>
            )}
            {batchMutation.isSuccess && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full",
                  "border border-brand-500/30 bg-brand-500/10",
                  "px-3 py-1 text-xs font-medium text-brand-100",
                  "animate-scale-in"
                )}
              >
                Проанализировано: {batchMutation.data?.analyzed ?? 0}
              </span>
            )}
          </div>

          {/* Filter chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
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

            {/* Сбросить: appears only when ≥1 filter is active. */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className={clsx(
                  "inline-flex select-none items-center gap-1 rounded-full",
                  "border border-white/15 bg-white/5 px-3 py-1",
                  "text-xs font-medium text-muted",
                  "transition-all duration-200 ease-spring active:scale-95",
                  "hover:border-white/25 hover:text-white",
                  "animate-scale-in"
                )}
              >
                <X className="h-3 w-3" />
                Сбросить{" "}
                <span className="tabular-nums">({activeFilterCount})</span>
              </button>
            )}
          </div>
        </form>
      </Reveal>

      {/* ── Results section ── */}
      <Reveal from="up" delay={120} duration={500}>
        <section className="card overflow-hidden">
          {/* Table header bar */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-white">
              Лиды{" "}
              <span className="ml-1 text-muted">
                {leadsQuery.isLoading ? (
                  "…"
                ) : (
                  <span className="tabular-nums">({total})</span>
                )}
              </span>
            </h2>
            {leadsQuery.isFetching && !leadsQuery.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
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
      </Reveal>

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
/* LeadsTable                                                           */
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
    return <SkeletonRows />;
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm text-red-300">
        Не удалось загрузить лиды. Проверьте, что backend запущен.
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    /* Horizontally scrollable container so the table stays usable on mobile. */
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Sticky header stays visible as the user scrolls down a long list. */}
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-white/10 backdrop-blur-xl bg-panel/90">
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
          {items.map((c, i) => {
            const analyzing = analyzingId === c.id;
            return (
              <tr
                key={c.id}
                className="row-hover border-b border-white/5 last:border-0 animate-fade-up"
                style={{
                  /* Stagger entrance so rows cascade in, not all at once. */
                  animationDelay: `${Math.min(i * 35, 700)}ms`,
                }}
              >
                {/* Company + website */}
                <td className="td">
                  <div className="font-medium text-white">{c.name}</div>
                  {c.website ? (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      {shortUrl(c.website)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-red-400/80">нет сайта</span>
                  )}
                </td>

                <td className="td text-muted">{c.category ?? "—"}</td>
                <td className="td text-muted">{c.city ?? "—"}</td>

                {/* Contacts: icons are colour-coded + tooltipped for clarity. */}
                <td className="td">
                  <div className="flex items-center gap-2">
                    <span
                      title={c.phone ? `Телефон: ${c.phone}` : "Телефон не указан"}
                      className={clsx(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
                        c.phone
                          ? "bg-teal-500/15 text-teal-300"
                          : "text-white/20"
                      )}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                    <span
                      title={c.email ? `Email: ${c.email}` : "Email не указан"}
                      className={clsx(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
                        c.email
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "text-white/20"
                      )}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </td>

                {/* Rating */}
                <td className="td">
                  {c.rating != null ? (
                    <div className="flex items-center gap-1 text-white/90">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="tabular-nums">
                        {c.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted">
                        ({c.reviews_count ?? 0})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>

                {/* Score ring — the arc communicates hot leads at a glance.
                    Deliberately the only score element in the row: pairing it
                    with a numeric badge repeated the same value and pushed the
                    actions column off-screen. */}
                <td className="td">
                  <ScoreRing score={c.ai_score} size={40} delay={i * 45} />
                </td>

                {/* Status */}
                <td className="td">
                  <StatusPill status={c.status} />
                </td>

                {/* Actions. The secondary action collapses to an icon so the
                    primary CTA still fits on a 1440px screen without the row
                    overflowing horizontally. */}
                <td className="td">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onAnalyze(c.id)}
                      disabled={analyzing}
                      title="Проанализировать лид"
                      aria-label="Проанализировать лид"
                      className="btn-secondary px-2.5 py-1.5 text-xs"
                    >
                      {analyzing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      <span className="sr-only">Анализ</span>
                    </button>
                    <button
                      onClick={() => onOffer(c)}
                      title="Сгенерировать коммерческое предложение"
                      className="btn-primary whitespace-nowrap px-3 py-1.5 text-xs"
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

/* ------------------------------------------------------------------ */
/* Skeleton rows                                                        */
/* ------------------------------------------------------------------ */

/**
 * Eight skeleton rows that match the real row height.
 * Staggered delay makes them feel like real content arriving.
 */
function SkeletonRows() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Company column */}
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="skeleton h-4 w-2/5 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
          {/* Category */}
          <div className="skeleton h-3.5 w-20 rounded" />
          {/* City */}
          <div className="skeleton h-3.5 w-16 rounded" />
          {/* Contacts */}
          <div className="flex gap-2">
            <div className="skeleton h-6 w-7 rounded" />
            <div className="skeleton h-6 w-7 rounded" />
          </div>
          {/* Score ring placeholder */}
          <div className="skeleton h-10 w-10 rounded-full" />
          {/* Status */}
          <div className="skeleton h-5 w-16 rounded-full" />
          {/* Actions */}
          <div className="flex gap-2">
            <div className="skeleton h-7 w-20 rounded-lg" />
            <div className="skeleton h-7 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

/**
 * Radar-style illustration built entirely from divs.
 * Pulsing rings communicate "scanning" — appropriate for a lead-hunting context.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-5 py-20">
      {/* Radar rings */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer pulse rings — staggered so they feel like sonar waves */}
        <span
          className="absolute inset-0 rounded-full border border-brand-500/30 animate-pulse-ring"
          style={{ animationDelay: "0ms" }}
          aria-hidden
        />
        <span
          className="absolute inset-2 rounded-full border border-brand-500/25 animate-pulse-ring"
          style={{ animationDelay: "600ms" }}
          aria-hidden
        />
        <span
          className="absolute inset-4 rounded-full border border-brand-500/20 animate-pulse-ring"
          style={{ animationDelay: "1200ms" }}
          aria-hidden
        />
        {/* Crosshairs */}
        <div
          className="absolute inset-8 rounded-full bg-brand-500/10 border border-brand-500/40"
          aria-hidden
        />
        {/* Sweep line */}
        <div
          className="absolute inset-8 origin-bottom-right rounded-full overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute bottom-1/2 left-1/2 h-1/2 w-0.5 -translate-x-1/2 origin-bottom animate-radar-sweep"
            style={{
              background:
                "linear-gradient(to top, rgba(59,108,255,0.8), transparent)",
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-white/70">
          Цели не обнаружены
        </p>
        <p className="mt-1 text-xs text-muted">
          Запустите поиск выше или снимите фильтры, чтобы расширить зону
          сканирования.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Utility                                                              */
/* ------------------------------------------------------------------ */

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}
