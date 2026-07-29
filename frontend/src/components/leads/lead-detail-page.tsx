"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarDays, Clock3, ExternalLink, Globe2, Mail, MapPin, MessageSquareText, Phone, ScanSearch, Sparkles } from "lucide-react";
import { AnalysisChecklist } from "@/components/leads/analysis-checklist";
import { LeadHero } from "@/components/leads/lead-hero";
import { LeadTimeline } from "@/components/leads/lead-timeline";
import { OfferDialog } from "@/components/leads/offer-dialog";
import { ScoreBreakdown } from "@/components/leads/score-breakdown";
import { StatusDialog } from "@/components/leads/status-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import type { CompanyDetail, CRMStatus } from "@/types/domain";
import { formatDate, formatDateTime, shortUrl } from "@/utils/format";

type DetailTab = "overview" | "audit" | "activity";

export default function LeadDetailPage({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [offerOpen, setOfferOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const leadQuery = useQuery({ queryKey: queryKeys.leads.detail(id), queryFn: () => api.getLead(id), enabled: Number.isFinite(id) });
  const historyQuery = useQuery({ queryKey: queryKeys.leads.history(id), queryFn: () => api.getLeadHistory(id), enabled: Number.isFinite(id) });
  const statusHistoryQuery = useQuery({ queryKey: queryKeys.leads.statusHistory(id), queryFn: () => api.getStatusHistory(id), enabled: Number.isFinite(id) });
  const messagesQuery = useQuery({ queryKey: queryKeys.campaigns.messages(id), queryFn: () => api.listMessages(id), enabled: Number.isFinite(id) });
  const refresh = () => { queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) }); queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }); queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); queryClient.invalidateQueries({ queryKey: queryKeys.crm.all }); };

  const analyzeMutation = useMutation({ mutationFn: () => api.analyzeLead(id), onSuccess: () => { refresh(); toast({ title: "Анализ обновлён", description: "AI Score и рекомендации пересчитаны.", tone: "success" }); }, onError: (error) => toast({ title: "Анализ не выполнен", description: (error as Error).message, tone: "error" }) });
  const monitorMutation = useMutation({
    mutationFn: (enabled: boolean) => api.toggleMonitor(id, enabled),
    onMutate: async (enabled) => { await queryClient.cancelQueries({ queryKey: queryKeys.leads.detail(id) }); const previous = queryClient.getQueryData<CompanyDetail>(queryKeys.leads.detail(id)); queryClient.setQueryData<CompanyDetail>(queryKeys.leads.detail(id), (current) => current ? { ...current, monitored: enabled } : current); return { previous }; },
    onError: (error, _enabled, context) => { if (context?.previous) queryClient.setQueryData(queryKeys.leads.detail(id), context.previous); toast({ title: "Мониторинг не изменён", description: (error as Error).message, tone: "error" }); },
    onSuccess: (_data, enabled) => toast({ title: enabled ? "Мониторинг включён" : "Мониторинг отключён", tone: "success" }), onSettled: refresh,
  });
  const statusMutation = useMutation({ mutationFn: ({ status, note }: { status: CRMStatus; note?: string }) => api.updateStatus(id, status, note), onSuccess: () => { setStatusOpen(false); refresh(); queryClient.invalidateQueries({ queryKey: queryKeys.leads.statusHistory(id) }); toast({ title: "Статус обновлён", tone: "success" }); }, onError: (error) => toast({ title: "Статус не изменён", description: (error as Error).message, tone: "error" }) });

  if (leadQuery.isLoading) return <PageSkeleton />;
  if (leadQuery.isError || !leadQuery.data) return <div className="rounded-2xl border border-slate-200 bg-white"><ErrorState title="Лид недоступен" message={(leadQuery.error as Error)?.message || "Компания не найдена."} onRetry={() => leadQuery.refetch()} /></div>;
  const company = leadQuery.data;
  const analysis = company.analysis;

  return (
    <div className="space-y-5">
      <LeadHero company={company} onAnalyze={() => analyzeMutation.mutate()} analyzeLoading={analyzeMutation.isPending} onOffer={() => setOfferOpen(true)} onStatus={() => setStatusOpen(true)} onMonitor={() => monitorMutation.mutate(!company.monitored)} monitorLoading={monitorMutation.isPending} />
      <div className="flex overflow-x-auto"><Tabs items={[{ value: "overview", label: "Обзор" }, { value: "audit", label: "Цифровой аудит" }, { value: "activity", label: "История", count: (historyQuery.data?.length ?? 0) + (statusHistoryQuery.data?.length ?? 0) + (messagesQuery.data?.length ?? 0) }]} value={tab} onChange={setTab} /></div>

      {tab === "overview" && <div className="space-y-4">
        {analysis ? <Card className="p-5 sm:p-6"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-slate-900">AI-анализ возможности</h2><Badge tone={analysis.website_status === "ok" ? "emerald" : analysis.website_status === "none" ? "rose" : "amber"}>{websiteStatusLabel(analysis.website_status)}</Badge></div><p className="mt-1 text-xs text-slate-400">Последнее обновление {formatDateTime(analysis.created_at)}</p></div><Button variant="secondary" size="sm" onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}><ScanSearch className="h-3.5 w-3.5" />Обновить анализ</Button></div>{analysis.summary && <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><Sparkles className="mr-2 inline h-4 w-4 text-violet-600" />{analysis.summary}</div>}<AnalysisChecklist data={analysis.website_checks} /></Card> : <Card><EmptyState icon={ScanSearch} title="Лид ещё не проанализирован" description="Запустите аудит сайта, чтобы получить AI Score, технические проверки и персональные рекомендации." action={<Button size="sm" onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}><Sparkles className="h-3.5 w-3.5" />Запустить AI-анализ</Button>} /></Card>}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <Card className="p-5 sm:p-6"><h2 className="text-sm font-semibold text-slate-900">Профиль компании</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><InfoItem icon={Building2} label="Категория" value={company.category || "Не указана"} /><InfoItem icon={MapPin} label="Адрес" value={company.address || [company.city, company.region, company.country].filter(Boolean).join(", ") || "Не указан"} /><InfoItem icon={Clock3} label="Часы работы" value={company.opening_hours || "Не указаны"} /><InfoItem icon={CalendarDays} label="Добавлен" value={formatDate(company.created_at)} /></div>{company.description && <div className="mt-5 border-t border-slate-100 pt-5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Описание</p><p className="mt-2 text-sm leading-6 text-slate-600">{company.description}</p></div>}</Card>
          <Card className="p-5 sm:p-6"><h2 className="text-sm font-semibold text-slate-900">Контакты</h2><div className="mt-4 space-y-3"><ContactItem icon={Phone} label="Телефон" value={company.phone} href={company.phone ? `tel:${company.phone}` : undefined} /><ContactItem icon={Mail} label="Email" value={company.email} href={company.email ? `mailto:${company.email}` : undefined} /><ContactItem icon={Globe2} label="Сайт" value={company.website ? shortUrl(company.website) : null} href={company.website ? (company.website.startsWith("http") ? company.website : `https://${company.website}`) : undefined} /></div>{Object.keys(company.socials).length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Социальные сети</p><div className="flex flex-wrap gap-2">{Object.entries(company.socials).map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium capitalize text-slate-600 hover:bg-violet-50 hover:text-violet-700">{name}<ExternalLink className="h-3 w-3" /></a>)}</div></div>}</Card>
        </div>
      </div>}

      {tab === "audit" && (analysis ? <div className="space-y-4"><Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="text-sm font-semibold text-slate-900">Технический аудит сайта</h2><p className="mt-1 text-xs text-slate-400">SEO, безопасность, производительность и конверсионные элементы.</p></div><AnalysisChecklist data={analysis.website_checks} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><AuditField label="Title" value={typeof analysis.website_checks.title === "string" ? analysis.website_checks.title : "Не найден"} /><AuditField label="GBP issues" value={analysis.gbp_issues.length ? analysis.gbp_issues.join(", ") : "Проблемы не найдены"} /><AuditField label="Website status" value={websiteStatusLabel(analysis.website_status)} /></div></Card><Card className="p-5 sm:p-6"><ScoreBreakdown breakdown={analysis.score_breakdown} services={analysis.possible_services} /></Card><Card className="p-5 sm:p-6"><h2 className="text-sm font-semibold text-slate-900">Социальное присутствие</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(analysis.social_analysis).map(([network, data]) => <div key={network} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className={`h-2.5 w-2.5 rounded-full ${data.found ? "bg-emerald-500" : "bg-slate-300"}`} /><div className="min-w-0 flex-1"><p className="text-xs font-semibold capitalize text-slate-700">{network}</p><p className="text-[10px] text-slate-400">{data.found ? "Профиль найден" : "Не найден"}</p></div>{data.url && <a href={String(data.url)} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5 text-slate-400" /></a>}</div>)}</div></Card></div> : <Card><EmptyState icon={ScanSearch} title="Сначала выполните анализ" description="Технические сигналы и рекомендации появятся после проверки сайта." action={<Button size="sm" onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>Запустить анализ</Button>} /></Card>)}

      {tab === "activity" && <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]"><Card className="p-5 sm:p-6"><div className="mb-6"><h2 className="text-sm font-semibold text-slate-900">Timeline</h2><p className="mt-1 text-xs text-slate-400">Статусы, изменения мониторинга и сообщения.</p></div><LeadTimeline statuses={statusHistoryQuery.data ?? []} changes={historyQuery.data ?? []} messages={messagesQuery.data ?? []} /></Card><Card className="p-5 sm:p-6"><h2 className="text-sm font-semibold text-slate-900">История сообщений</h2><div className="mt-4 space-y-3">{messagesQuery.data?.length ? messagesQuery.data.map((message) => <div key={message.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-slate-800">{message.subject || "Без темы"}</p><Badge tone={message.status === "sent" ? "emerald" : message.status === "failed" ? "rose" : "neutral"}>{message.status}</Badge></div><p className="mt-2 line-clamp-3 text-[11px] leading-5 text-slate-500">{message.body}</p><p className="mt-2 text-[10px] text-slate-400">{formatDateTime(message.created_at)} · {message.channel}</p></div>) : <EmptyState icon={MessageSquareText} title="Сообщений нет" description="Создайте первое персональное предложение для этого лида." action={<Button size="sm" onClick={() => setOfferOpen(true)}>Создать предложение</Button>} />}</div></Card></div>}

      <OfferDialog company={company} open={offerOpen} onOpenChange={setOfferOpen} />
      <StatusDialog open={statusOpen} onOpenChange={setStatusOpen} current={company.status} loading={statusMutation.isPending} onSubmit={(status, note) => statusMutation.mutate({ status, note })} />
    </div>
  );
}

function websiteStatusLabel(status: string) { return status === "ok" ? "Сайт доступен" : status === "none" ? "Сайт отсутствует" : status === "broken" ? "Сайт сломан" : "Сайт недоступен"; }
function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) { return <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xs font-medium leading-5 text-slate-700">{value}</p></div></div>; }
function ContactItem({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | null; href?: string }) { const content = <><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] text-slate-400">{label}</span><span className="block truncate text-xs font-medium text-slate-700">{value || "Не указан"}</span></span>{href && <ExternalLink className="h-3.5 w-3.5 text-slate-300" />}</>; return href ? <a href={href.startsWith("http") ? href : href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-100 p-2 hover:bg-slate-50">{content}</a> : <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-2 opacity-70">{content}</div>; }
function AuditField({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-slate-700">{value}</p></div>; }
