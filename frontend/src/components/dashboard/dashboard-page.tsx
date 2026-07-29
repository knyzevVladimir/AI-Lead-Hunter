"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Download, Globe2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { ActiveCampaigns } from "@/components/dashboard/active-campaigns";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PipelineLegend } from "@/components/dashboard/pipeline-legend";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferences } from "@/providers/preferences-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import { averageScore, countInWindow, dailySeries, groupCount, isToday, percentageChange } from "@/utils/analytics";
import { formatCurrency, formatNumber } from "@/utils/format";

const AcquisitionChart = dynamic(
  () => import("@/components/dashboard/acquisition-chart").then((module) => module.AcquisitionChart),
  { ssr: false, loading: () => <Skeleton className="h-[260px]" /> },
);
const PipelineChart = dynamic(
  () => import("@/components/dashboard/pipeline-chart").then((module) => module.PipelineChart),
  { ssr: false, loading: () => <Skeleton className="h-[260px]" /> },
);

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { dealValue } = usePreferences();
  const statsQuery = useQuery({ queryKey: queryKeys.dashboard, queryFn: api.getDashboard });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads.list({ limit: 500, sort_by_score: true }), queryFn: () => api.listLeads({ limit: 500, sort_by_score: true }) });
  const messagesQuery = useQuery({ queryKey: queryKeys.campaigns.messages(), queryFn: () => api.listMessages() });
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns.list, queryFn: api.listCampaigns });

  const leads = leadsQuery.data?.items ?? [];
  const stats = statsQuery.data;
  const series = dailySeries(leads);
  const currentWeek = countInWindow(leads, 6);
  const previousWeek = countInWindow(leads, 13, 7);
  const trend = percentageChange(currentWeek, previousWeek);
  const average = averageScore(leads);
  const promising = leads.filter((lead) => (lead.ai_score ?? 0) >= 60).length;
  const potentialRevenue = promising * dealValue;
  const sparkline = series.slice(-10).map((point) => point.leads);
  const categoryData = groupCount(leads, (lead) => lead.category, 7);
  const cityData = groupCount(leads, (lead) => lead.city, 6);
  const regionData = groupCount(leads, (lead) => lead.country, 6);
  const pipelineData = STATUS_ORDER.map((status) => ({ name: STATUS_META[status].short, value: leads.filter((lead) => lead.status === status).length })).filter((item) => item.value > 0);
  const recentLeads = [...leads].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const loading = statsQuery.isLoading || leadsQuery.isLoading;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
  };

  if (leadsQuery.isError && !leadsQuery.data) {
    return <div className="space-y-6"><PageHeader title="Dashboard" description="Операционный обзор воронки и потенциала продаж." /><div className="rounded-2xl border border-slate-200 bg-white"><ErrorState message={(leadsQuery.error as Error).message} onRetry={refresh} /></div></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue workspace"
        title="Доброе утро, Vladimir"
        description="Главное по поиску, качеству лидов и движению воронки — на одном экране."
        actions={<><Button variant="secondary" size="sm" onClick={refresh} loading={leadsQuery.isFetching || statsQuery.isFetching}><RefreshCw className="h-3.5 w-3.5" />Обновить</Button><a href={api.exportCsvUrl()} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700"><Download className="h-3.5 w-3.5" />Экспорт</a></>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Всего лидов" value={formatNumber(stats?.companies_found ?? leads.length)} description="к прошлой неделе" icon={Building2} trend={trend} sparkline={sparkline} loading={loading} accent="violet" />
        <MetricCard label="Новых сегодня" value={formatNumber(leads.filter((lead) => isToday(lead.created_at)).length)} description={`${currentWeek} за 7 дней`} icon={Sparkles} sparkline={sparkline} loading={loading} accent="blue" />
        <MetricCard label="Без сайта" value={formatNumber(stats?.without_website ?? leads.filter((lead) => !lead.website).length)} description="готовы к предложению" icon={Globe2} loading={loading} accent="amber" />
        <MetricCard label="Средний AI Score" value={average.toFixed(0)} description={`${promising} лидов с оценкой 60+`} icon={TrendingUp} loading={loading} accent="emerald" />
        <MetricCard label="Потенциал воронки" value={formatCurrency(potentialRevenue)} description={`оценка при чеке ${formatCurrency(dealValue)}`} icon={TrendingUp} loading={loading} accent="violet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,.8fr)]">
        <SectionCard title="Динамика привлечения" description="Новые лиды и выполненные анализы за последние 30 дней" action={<div className="hidden items-center gap-4 text-[10px] text-slate-400 sm:flex"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-600" />Лиды</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-600" />Анализы</span></div>}>
          {loading ? <Skeleton className="h-[260px]" /> : <AcquisitionChart data={series} />}
        </SectionCard>
        <SectionCard title="Структура воронки" description="Распределение лидов по CRM-статусам">
          {loading ? <Skeleton className="h-[260px]" /> : pipelineData.length ? <><PipelineChart data={pipelineData} centerLabel="лидов" /><PipelineLegend data={pipelineData} /></> : <div className="py-20 text-center text-sm text-slate-400">Воронка пока пуста</div>}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title="Активность поиска" description="Интенсивность добавления лидов за последние 11 недель">
          {loading ? <Skeleton className="h-24" /> : <ActivityHeatmap leads={leads} />}
        </SectionCard>
        <SectionCard title="Категории бизнеса" description="Наиболее частые сегменты в базе">
          {loading ? <Skeleton className="h-44" /> : <BreakdownList data={categoryData} />}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Последние анализы" description="Недавно обновлённые AI-оценки"><RecentAnalyses leads={recentLeads} /></SectionCard>
        <SectionCard title="Последние действия" description="Единый поток событий"><RecentActivity leads={recentLeads} messages={messagesQuery.data ?? []} /></SectionCard>
        <SectionCard title="Активные кампании" description="Запущенные цепочки касаний"><ActiveCampaigns campaigns={campaignsQuery.data ?? []} /></SectionCard>
        <SectionCard title="География" description="Города с наибольшим числом лидов"><BreakdownList data={cityData} /><div className="my-5 h-px bg-slate-100" /><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Top regions</p><BreakdownList data={regionData} /></SectionCard>
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold">Готовы найти следующую возможность?</p><p className="mt-0.5 text-xs text-slate-400">Запустите поиск, а AI автоматически подсветит самые перспективные компании.</p></div>
        <Link href="/search" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-white px-3.5 text-xs font-semibold text-slate-950 transition hover:bg-violet-50">Начать поиск<ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}
