"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Eye, Sparkles, Workflow, X } from "lucide-react";
import { BulkStatusDialog } from "@/components/leads/bulk-status-dialog";
import { LeadGridRow } from "@/components/leads/lead-grid-row";
import { DEFAULT_LEADS_FILTERS, LeadsToolbar, type LeadsFilters } from "@/components/leads/leads-toolbar";
import { OfferDialog } from "@/components/leads/offer-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useInfiniteObserver } from "@/hooks/use-infinite-observer";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import type { Company, CompanyList, CRMStatus, ListLeadsParams } from "@/types/domain";

const PAGE_SIZE = 40;

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filters, setFilters] = useState<LeadsFilters>(DEFAULT_LEADS_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [offerCompany, setOfferCompany] = useState<Company | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const params = useMemo<ListLeadsParams>(() => ({
    category: filters.category || undefined,
    city: filters.city || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    monitored: filters.monitored || undefined,
    min_score: filters.minScore || undefined,
    no_website: filters.noWebsite || undefined,
    has_email: filters.hasEmail || undefined,
    no_socials: filters.noSocials || undefined,
    no_https: filters.noHttps || undefined,
    no_booking: filters.noBooking || undefined,
    sort_by_score: filters.sort === "score",
    limit: 500,
  }), [filters]);
  const listKey = queryKeys.leads.list(params);
  const leadsQuery = useQuery({ queryKey: listKey, queryFn: () => api.listLeads(params) });
  const normalized = filters.search.trim().toLocaleLowerCase("ru");
  const filtered = useMemo(() => (leadsQuery.data?.items ?? []).filter((company) => !normalized || [company.name, company.category, company.city, company.address, company.phone, company.email, company.website].some((value) => value?.toLocaleLowerCase("ru").includes(normalized))), [leadsQuery.data, normalized]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const loadMore = useCallback(() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length)), [filtered.length]);
  const sentinelRef = useInfiniteObserver(loadMore, hasMore);

  useEffect(() => { setVisibleCount(PAGE_SIZE); setSelectedIds(new Set()); }, [filters]);
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }); queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); queryClient.invalidateQueries({ queryKey: queryKeys.crm.all }); };

  const analyzeMutation = useMutation({ mutationFn: api.analyzeLead, onSuccess: () => { invalidate(); toast({ title: "AI-анализ завершён", tone: "success" }); }, onError: (error) => toast({ title: "Ошибка анализа", description: (error as Error).message, tone: "error" }) });
  const monitorMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => api.toggleMonitor(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<CompanyList>(listKey);
      queryClient.setQueryData<CompanyList>(listKey, (current) => current ? { ...current, items: current.items.map((company) => company.id === id ? { ...company, monitored: enabled } : company) } : current);
      return { previous };
    },
    onError: (error, _variables, context) => { if (context?.previous) queryClient.setQueryData(listKey, context.previous); toast({ title: "Мониторинг не изменён", description: (error as Error).message, tone: "error" }); },
    onSuccess: (_data, variables) => toast({ title: variables.enabled ? "Мониторинг включён" : "Мониторинг отключён", tone: "success" }),
    onSettled: invalidate,
  });
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async () => selectedIds.size ? Promise.all([...selectedIds].map((id) => api.analyzeLead(id))) : api.analyzeBatch(100, true),
    onSuccess: () => { invalidate(); toast({ title: "Пакетный анализ завершён", description: selectedIds.size ? `Обработано ${selectedIds.size} лидов.` : "Обработаны новые лиды.", tone: "success" }); setSelectedIds(new Set()); },
    onError: (error) => toast({ title: "Пакетный анализ остановлен", description: (error as Error).message, tone: "error" }),
  });
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: CRMStatus; note?: string }) => {
      const selected = filtered.filter((company) => selectedIds.has(company.id));
      await Promise.all(selected.map((company) => api.updateStatus(company.id, status, note)));
      return selected.map((company) => ({ id: company.id, status: company.status }));
    },
    onSuccess: (previous) => {
      invalidate(); setStatusDialogOpen(false); setSelectedIds(new Set());
      toast({ title: "Статус обновлён", description: `Изменено ${previous.length} лидов.`, tone: "success", action: { label: "Отменить", onClick: () => { Promise.all(previous.map((item) => api.updateStatus(item.id, item.status, "Отмена массового изменения"))).then(invalidate); } } });
    },
    onError: (error) => toast({ title: "Статус изменён не полностью", description: (error as Error).message, tone: "error" }),
  });

  const allVisibleSelected = visible.length > 0 && visible.every((company) => selectedIds.has(company.id));
  const setAllVisible = (checked: boolean) => setSelectedIds((current) => { const next = new Set(current); visible.forEach((company) => checked ? next.add(company.id) : next.delete(company.id)); return next; });
  const setSelected = (id: number, checked: boolean) => setSelectedIds((current) => { const next = new Set(current); checked ? next.add(id) : next.delete(id); return next; });
  const selectedCompanies = filtered.filter((company) => selectedIds.has(company.id));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Lead database" title="Лиды" description="Единая база компаний с AI-оценкой, контактами, цифровым аудитом и CRM-статусом." actions={<Button variant="primary" size="sm" onClick={() => bulkAnalyzeMutation.mutate()} loading={bulkAnalyzeMutation.isPending}><Sparkles className="h-3.5 w-3.5" />AI-анализ</Button>} />

      <LeadsToolbar filters={filters} onChange={setFilters} onAnalyzeAll={() => bulkAnalyzeMutation.mutate()} analyzeLoading={bulkAnalyzeMutation.isPending} exportUrl={api.exportCsvUrl({ has_email: filters.hasEmail || undefined, no_website: filters.noWebsite || undefined, min_score: filters.minScore || undefined })} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3"><div><p className="text-xs font-semibold text-slate-800">База компаний <span className="ml-1 font-normal text-slate-400">{leadsQuery.isLoading ? "…" : filtered.length}</span></p><p className="mt-0.5 text-[10px] text-slate-400">{visible.length} показано · до 500 записей по текущему API-запросу</p></div><Link href="/search" className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700">Добавить лиды<ArrowRight className="h-3.5 w-3.5" /></Link></div>
        <div className="hidden grid-cols-[36px_minmax(230px,1.45fr)_minmax(190px,1fr)_minmax(150px,.8fr)_90px_150px_115px_44px] items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.08em] text-slate-400 lg:grid"><Checkbox checked={allVisibleSelected} onCheckedChange={setAllVisible} label="Выбрать видимые лиды" /><span>Компания</span><span>Категория и адрес</span><span>Контакты</span><span>AI Score</span><span>CRM статус</span><span>Последний анализ</span><span /></div>
        {leadsQuery.isLoading ? <GridSkeleton /> : leadsQuery.isError ? <ErrorState message={(leadsQuery.error as Error).message} onRetry={() => leadsQuery.refetch()} /> : visible.length === 0 ? <EmptyState icon={Building2} title="Лиды не найдены" description="Измените фильтры или запустите новый поиск компаний." action={<Link href="/search" className="text-xs font-semibold text-violet-600">Перейти к поиску</Link>} /> : <div className="space-y-3 p-3 lg:space-y-0 lg:p-0">{visible.map((company) => <LeadGridRow key={company.id} company={company} selected={selectedIds.has(company.id)} onSelectedChange={(checked) => setSelected(company.id, checked)} onAnalyze={() => analyzeMutation.mutate(company.id)} onOffer={() => setOfferCompany(company)} onMonitor={() => monitorMutation.mutate({ id: company.id, enabled: !company.monitored })} pendingAction={analyzeMutation.isPending && analyzeMutation.variables === company.id ? "analyze" : monitorMutation.isPending && monitorMutation.variables?.id === company.id ? "monitor" : null} />)}{hasMore && <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-5 text-xs text-slate-400"><Spinner />Загружаем ещё лиды…</div>}</div>}
      </section>

      <AnimatePresence>{selectedIds.size > 0 && <motion.div initial={{ opacity: 0, y: 18, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 14, x: "-50%" }} className="fixed bottom-5 left-1/2 z-[70] flex w-[min(720px,calc(100vw-2rem))] flex-wrap items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2.5 pl-4 text-white shadow-[0_20px_60px_rgba(15,23,42,.35)]"><span className="mr-auto text-xs font-semibold">Выбрано {selectedIds.size}</span><Button size="sm" variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => bulkAnalyzeMutation.mutate()} loading={bulkAnalyzeMutation.isPending}><Sparkles className="h-3.5 w-3.5" />Анализ</Button><Button size="sm" variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => Promise.all(selectedCompanies.map((company) => api.toggleMonitor(company.id, true))).then(() => { invalidate(); setSelectedIds(new Set()); toast({ title: "Мониторинг включён", tone: "success" }); })}><Eye className="h-3.5 w-3.5" />Мониторинг</Button><Button size="sm" variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setStatusDialogOpen(true)}><Workflow className="h-3.5 w-3.5" />Статус</Button><button type="button" onClick={() => setSelectedIds(new Set())} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Снять выделение"><X className="h-4 w-4" /></button></motion.div>}</AnimatePresence>

      <OfferDialog company={offerCompany} open={Boolean(offerCompany)} onOpenChange={(open) => !open && setOfferCompany(null)} />
      <BulkStatusDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} count={selectedIds.size} loading={bulkStatusMutation.isPending} onSubmit={(status, note) => bulkStatusMutation.mutate({ status, note })} />
    </div>
  );
}

function GridSkeleton() {
  return <div className="space-y-3 p-3 lg:space-y-0 lg:p-0">{Array.from({ length: 9 }).map((_, index) => <div key={index} className="grid min-h-[72px] grid-cols-[36px_1.45fr_1fr_.8fr_90px_150px_115px_44px] items-center gap-3 border-b border-slate-100 px-4 last:border-b-0"><Skeleton className="h-4 w-4" /><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-2.5 w-24" /></div></div>{Array.from({ length: 6 }).map((__, cell) => <Skeleton key={cell} className="h-5 w-full max-w-28" />)}</div>)}</div>;
}
