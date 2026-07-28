"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Globe2,
  Mail,
  Flame,
  Send,
  MessageCircleReply,
  TrendingUp,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { getDashboard, listLeads } from "@/lib/api";
import type { Company, DashboardStats } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";
import StatusPill from "@/components/StatusPill";

interface StatCardDef {
  key: keyof DashboardStats;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  suffix?: string;
}

const CARDS: StatCardDef[] = [
  {
    key: "companies_found",
    label: "Найдено компаний",
    icon: Building2,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
  },
  {
    key: "without_website",
    label: "Без сайта",
    icon: Globe2,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    key: "with_email",
    label: "Есть Email",
    icon: Mail,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    key: "very_promising",
    label: "Очень перспективных",
    icon: Flame,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    key: "emails_sent",
    label: "Отправлено писем",
    icon: Send,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
  },
  {
    key: "replies",
    label: "Ответов",
    icon: MessageCircleReply,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    key: "conversion",
    label: "Конверсия",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    suffix: "%",
  },
];

function StatCard({
  def,
  value,
  loading,
}: {
  def: StatCardDef;
  value: number | undefined;
  loading: boolean;
}) {
  const Icon = def.icon;
  return (
    <div className="card card-hover flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${def.iconBg}`}
      >
        <Icon className={`h-5 w-5 ${def.iconColor}`} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-muted">
          {def.label}
        </div>
        {loading ? (
          <div className="skeleton mt-1.5 h-7 w-16" />
        ) : (
          <div className="text-2xl font-bold tabular-nums text-ink">
            {value ?? 0}
            {def.suffix && (
              <span className="ml-0.5 text-base font-semibold text-muted">
                {def.suffix}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const promisingQuery = useQuery({
    queryKey: ["leads", "promising"],
    queryFn: () =>
      listLeads({ min_score: 60, sort_by_score: true, limit: 10 }),
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Дашборд</h1>
        <p className="page-subtitle">
          Обзор воронки: от найденных компаний до клиентов.
        </p>
      </div>

      {/* Error banner */}
      {statsQuery.isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Не удалось загрузить статистику.{" "}
          <span className="text-rose-500">
            {(statsQuery.error as Error)?.message}
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((def) => (
          <StatCard
            key={def.key}
            def={def}
            value={stats?.[def.key]}
            loading={statsQuery.isLoading}
          />
        ))}
      </div>

      {/* Most promising */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">
              Самые перспективные
            </h2>
            <p className="text-xs text-muted">
              Лиды с AI-оценкой 60+ по вероятности покупки сайта.
            </p>
          </div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            Все лиды <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <PromisingTable
          items={promisingQuery.data?.items}
          loading={promisingQuery.isLoading}
          error={promisingQuery.isError}
        />
      </section>
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
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 text-center text-sm text-rose-600">
        Ошибка загрузки списка.
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted">
        Пока нет перспективных лидов. Запустите поиск и анализ на странице{" "}
        <Link href="/leads" className="font-medium text-brand-500 hover:text-brand-600">
          «Поиск и лиды»
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-slate-50/60">
            <th className="th">Компания</th>
            <th className="th">Город</th>
            <th className="th">Категория</th>
            <th className="th">AI Score</th>
            <th className="th">Статус</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr
              key={c.id}
              className="border-b border-line transition-colors last:border-0 hover:bg-slate-50/70"
            >
              <td className="td font-medium text-ink">{c.name}</td>
              <td className="td text-muted">{c.city ?? "—"}</td>
              <td className="td text-muted">{c.category ?? "—"}</td>
              <td className="td">
                <ScoreBadge score={c.ai_score} />
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
