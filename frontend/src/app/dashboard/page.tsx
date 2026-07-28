"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  Building2,
  Globe2,
  Mail,
  Flame,
  Send,
  MessageCircleReply,
  TrendingUp,
  ArrowUpRight,
  Radar,
  Sparkles,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { getDashboard, listLeads } from "@/lib/api";
import type { Company, DashboardStats } from "@/lib/types";
import StatusPill from "@/components/StatusPill";
import ScoreRing from "@/components/charts/ScoreRing";
import Sparkline from "@/components/charts/Sparkline";
import FunnelBars, { type FunnelStage } from "@/components/charts/FunnelBars";
import Reveal from "@/components/motion/Reveal";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import TiltCard from "@/components/motion/TiltCard";

// Canvas-only visual: keep it out of the server render and the initial chunk.
const Globe3D = dynamic(() => import("@/components/visuals/Globe3D"), {
  ssr: false,
});

/* ------------------------------------------------------------------ */
/* Stat cards                                                          */
/* ------------------------------------------------------------------ */

interface StatCardDef {
  key: keyof DashboardStats;
  label: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
  bar: string;
  suffix?: string;
  decimals?: number;
  /** Denominator for the share bar, or omitted to hide it. */
  shareOf?: keyof DashboardStats | "percent";
}

const CARDS: StatCardDef[] = [
  {
    key: "companies_found",
    label: "Найдено компаний",
    icon: Building2,
    accent: "text-brand-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(59,108,255,0.7)]",
    bar: "from-brand-500 to-brand-300",
  },
  {
    key: "without_website",
    label: "Без сайта",
    icon: Globe2,
    accent: "text-red-400",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(248,113,113,0.6)]",
    bar: "from-red-500 to-orange-400",
    shareOf: "companies_found",
  },
  {
    key: "with_email",
    label: "Есть Email",
    icon: Mail,
    accent: "text-cyan-400",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.6)]",
    bar: "from-cyan-500 to-teal-300",
    shareOf: "companies_found",
  },
  {
    key: "very_promising",
    label: "Очень перспективных",
    icon: Flame,
    accent: "text-orange-400",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(251,146,60,0.6)]",
    bar: "from-orange-500 to-amber-300",
    shareOf: "companies_found",
  },
  {
    key: "emails_sent",
    label: "Отправлено писем",
    icon: Send,
    accent: "text-indigo-400",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(129,140,248,0.6)]",
    bar: "from-indigo-500 to-violet-400",
  },
  {
    key: "replies",
    label: "Ответов",
    icon: MessageCircleReply,
    accent: "text-teal-400",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(45,212,191,0.6)]",
    bar: "from-teal-500 to-emerald-300",
    shareOf: "emails_sent",
  },
  {
    key: "conversion",
    label: "Конверсия",
    icon: TrendingUp,
    accent: "text-green-400",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(74,222,128,0.6)]",
    bar: "from-green-500 to-lime-300",
    suffix: "%",
    decimals: 1,
    shareOf: "percent",
  },
];

function StatCard({
  def,
  stats,
  loading,
  index,
}: {
  def: StatCardDef;
  stats: DashboardStats | undefined;
  loading: boolean;
  index: number;
}) {
  const Icon = def.icon;
  const value = stats?.[def.key];

  // Share bars are only derived from numbers the API actually returns —
  // no invented trend data.
  let share: number | null = null;
  if (stats && def.shareOf) {
    if (def.shareOf === "percent") {
      share = Math.min(100, Number(value ?? 0));
    } else {
      const total = stats[def.shareOf];
      share = total > 0 ? Math.min(100, (Number(value ?? 0) / total) * 100) : 0;
    }
  }

  return (
    <Reveal delay={index * 60} className="h-full">
      <TiltCard className="h-full" max={6} lift={4}>
        <div
          className={clsx(
            "card card-hover group h-full p-5 transition-shadow duration-300",
            def.glow
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="eyebrow leading-tight">{def.label}</span>
            <div className="rounded-lg bg-white/5 p-1.5 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110">
              <Icon className={clsx("h-4 w-4", def.accent)} />
            </div>
          </div>

          {loading ? (
            <div className="skeleton h-9 w-24" />
          ) : (
            <div className="text-3xl font-bold text-white">
              <AnimatedNumber
                value={value}
                decimals={def.decimals ?? 0}
                delay={index * 60}
              />
              {def.suffix && (
                <span className="ml-0.5 text-xl text-muted">{def.suffix}</span>
              )}
            </div>
          )}

          {share !== null && !loading && (
            <div className="mt-3">
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={clsx(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-smooth",
                    def.bar
                  )}
                  style={{
                    width: `${Math.max(share, 1.5)}%`,
                    transitionDelay: `${index * 60 + 200}ms`,
                  }}
                />
              </div>
              <div className="mt-1.5 text-[10px] text-muted">
                {def.shareOf === "percent"
                  ? "ответов на отправленные письма"
                  : def.shareOf === "emails_sent"
                    ? `${share.toFixed(0)}% от писем`
                    : `${share.toFixed(0)}% от базы`}
              </div>
            </div>
          )}
        </div>
      </TiltCard>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Derived analytics                                                   */
/* ------------------------------------------------------------------ */

const DAYS = 14;

/** Real series: companies added on each of the last 14 days. */
function dailyAddedSeries(items: Company[]): number[] {
  const buckets: number[] = new Array(DAYS).fill(0);
  const now = Date.now();
  const dayMs = 86_400_000;

  for (const c of items) {
    const t = Date.parse(c.created_at);
    if (Number.isNaN(t)) continue;
    const daysAgo = Math.floor((now - t) / dayMs);
    if (daysAgo >= 0 && daysAgo < DAYS) {
      buckets[DAYS - 1 - daysAgo] += 1;
    }
  }
  return buckets;
}

interface Bucket {
  label: string;
  count: number;
  color: string;
}

/** Real distribution of AI scores across the sampled leads. */
function scoreBuckets(items: Company[]): Bucket[] {
  const b: Bucket[] = [
    { label: "0–39", count: 0, color: "from-slate-600 to-slate-400" },
    { label: "40–59", count: 0, color: "from-sky-600 to-cyan-400" },
    { label: "60–79", count: 0, color: "from-amber-600 to-yellow-400" },
    { label: "80–100", count: 0, color: "from-orange-600 to-red-400" },
  ];

  for (const c of items) {
    const s = c.ai_score;
    if (s === null || s === undefined || s === 0) continue;
    if (s >= 80) b[3].count++;
    else if (s >= 60) b[2].count++;
    else if (s >= 40) b[1].count++;
    else b[0].count++;
  }
  return b;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const promisingQuery = useQuery({
    queryKey: ["leads", "promising"],
    queryFn: () => listLeads({ min_score: 60, sort_by_score: true, limit: 10 }),
  });

  // Sample of the base backing the two derived charts below.
  const analyticsQuery = useQuery({
    queryKey: ["leads", "analytics"],
    queryFn: () => listLeads({ limit: 500 }),
  });

  const stats = statsQuery.data;
  const sample = useMemo(
    () => analyticsQuery.data?.items ?? [],
    [analyticsQuery.data]
  );

  const series = useMemo(() => dailyAddedSeries(sample), [sample]);
  const buckets = useMemo(() => scoreBuckets(sample), [sample]);
  const addedTotal = series.reduce((a, b) => a + b, 0);
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);

  const funnel: FunnelStage[] = useMemo(
    () => [
      {
        label: "Найдено компаний",
        value: stats?.companies_found ?? 0,
        gradient: "from-brand-600 to-brand-300",
      },
      {
        label: "Без сайта",
        value: stats?.without_website ?? 0,
        gradient: "from-red-600 to-orange-400",
      },
      {
        label: "С контактным Email",
        value: stats?.with_email ?? 0,
        gradient: "from-cyan-600 to-teal-300",
      },
      {
        label: "Очень перспективные",
        value: stats?.very_promising ?? 0,
        gradient: "from-orange-600 to-amber-300",
      },
      {
        label: "Отправлено писем",
        value: stats?.emails_sent ?? 0,
        gradient: "from-indigo-600 to-violet-400",
      },
      {
        label: "Ответов",
        value: stats?.replies ?? 0,
        gradient: "from-teal-600 to-emerald-300",
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <Reveal blur duration={800}>
        <section className="card ring-gradient relative overflow-hidden">
          <div className="grid items-center lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 p-7 sm:p-9">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200">
                <Radar className="h-3.5 w-3.5" />
                Mission control
              </span>

              <h1 className="display mt-4">
                Охота за лидами
                <br />
                <span className="gradient-text">по всей карте</span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Платформа находит локальный бизнес, оценивает слабые места его
                цифрового присутствия и подсказывает, кому продавать сайт
                первым.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/leads" className="btn-primary">
                  <Radar className="h-4 w-4" />
                  Запустить поиск
                </Link>
                <Link href="/chat" className="btn-secondary">
                  <Sparkles className="h-4 w-4 text-neon-violet" />
                  Спросить AI
                </Link>
              </div>

              {/* Live counters */}
              <div className="mt-7 flex flex-wrap gap-6 border-t border-white/10 pt-5">
                <div>
                  <div className="text-2xl font-bold text-white">
                    <AnimatedNumber value={stats?.companies_found} />
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-muted">
                    компаний в базе
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-300">
                    <AnimatedNumber value={stats?.very_promising} delay={120} />
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-muted">
                    горячих лидов
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-300">
                    <AnimatedNumber value={stats?.with_email} delay={240} />
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-muted">
                    с Email
                  </div>
                </div>
              </div>
            </div>

            {/* Globe — bleeds past the panel edge on wide screens. */}
            <div className="relative h-[260px] sm:h-[320px] lg:h-[420px]">
              <div className="absolute inset-0 lg:-right-10 lg:scale-110">
                <Globe3D />
              </div>
              {/* Blend the canvas into the copy column. */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-panel/90 via-transparent to-transparent lg:from-panel/70" />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Error banner */}
      {statsQuery.isError && (
        <div className="animate-scale-in rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Не удалось загрузить статистику.{" "}
          <span className="text-red-300/70">
            {(statsQuery.error as Error)?.message}
          </span>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Stat cards                                                  */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((def, i) => (
          <StatCard
            key={def.key}
            def={def}
            stats={stats}
            loading={statsQuery.isLoading}
            index={i}
          />
        ))}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Funnel + derived analytics                                  */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal from="right">
          <section className="card h-full p-5">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-300" />
              <h2 className="text-base font-semibold text-white">Воронка</h2>
            </div>
            {statsQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-6 w-full" />
                ))}
              </div>
            ) : (
              <FunnelBars stages={funnel} />
            )}
          </section>
        </Reveal>

        <Reveal from="left" delay={80}>
          <section className="card h-full space-y-6 p-5">
            {/* New leads over time — computed from created_at. */}
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <h2 className="text-base font-semibold text-white">
                    Новые лиды
                  </h2>
                </div>
                <span className="text-xs text-muted">
                  за {DAYS} дней ·{" "}
                  <span className="font-semibold text-white">{addedTotal}</span>
                </span>
              </div>

              {analyticsQuery.isLoading ? (
                <div className="skeleton mt-3 h-12 w-full" />
              ) : addedTotal === 0 ? (
                <p className="py-4 text-xs text-muted">
                  За последние {DAYS} дней новых компаний не добавлялось.
                </p>
              ) : (
                <div className="mt-2 h-14">
                  <Sparkline data={series} color="#22d3ee" height={48} />
                </div>
              )}
            </div>

            {/* Score distribution — computed from ai_score. */}
            <div className="border-t border-white/10 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-white">
                Распределение AI-оценок
              </h3>

              {analyticsQuery.isLoading ? (
                <div className="skeleton h-24 w-full" />
              ) : (
                <div className="flex items-end gap-3">
                  {buckets.map((b, i) => (
                    <div key={b.label} className="flex-1 text-center">
                      <div className="mb-1 text-xs font-semibold tabular-nums text-white">
                        {b.count}
                      </div>
                      <div className="flex h-20 items-end">
                        <div
                          className={clsx(
                            "w-full rounded-t-md bg-gradient-to-t transition-all duration-700 ease-smooth",
                            b.color
                          )}
                          style={{
                            height: `${Math.max(
                              (b.count / maxBucket) * 100,
                              b.count > 0 ? 6 : 2
                            )}%`,
                            transitionDelay: `${i * 90}ms`,
                          }}
                        />
                      </div>
                      <div className="mt-1.5 text-[10px] text-muted">
                        {b.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </Reveal>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Most promising                                              */}
      {/* ---------------------------------------------------------- */}
      <Reveal>
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <Flame className="h-4 w-4 text-orange-400" />
                Самые перспективные
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Лиды с AI-оценкой 60+ по вероятности покупки сайта.
              </p>
            </div>
            <Link
              href="/leads"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
            >
              Все лиды
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <PromisingTable
            items={promisingQuery.data?.items}
            loading={promisingQuery.isLoading}
            error={promisingQuery.isError}
          />
        </section>
      </Reveal>
    </div>
  );
}

function PromisingTable({
  items,
  loading,
  error,
}: {
  items: Company[] | undefined;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 text-center text-sm text-red-300">
        Ошибка загрузки списка.
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-14 text-center text-sm text-muted">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 ring-1 ring-brand-500/30">
          <span className="absolute h-3 w-3 animate-pulse-ring rounded-full bg-brand-400/50" />
          <Radar className="relative h-6 w-6 text-brand-400" />
        </div>
        <p>
          Пока нет перспективных лидов. Запустите поиск и анализ на странице{" "}
          <Link
            href="/leads"
            className="font-medium text-brand-300 hover:text-brand-200"
          >
            «Поиск и лиды»
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="th">Компания</th>
            <th className="th">Город</th>
            <th className="th">Категория</th>
            <th className="th">AI Score</th>
            <th className="th">Статус</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c, i) => (
            <tr
              key={c.id}
              className="row-hover animate-fade-up border-b border-white/5 last:border-0"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <td className="td font-medium text-white">{c.name}</td>
              <td className="td text-muted">{c.city ?? "—"}</td>
              <td className="td text-muted">{c.category ?? "—"}</td>
              <td className="td">
                <ScoreRing score={c.ai_score} size={40} delay={i * 45} />
              </td>
              <td className="td">
                <StatusPill status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
