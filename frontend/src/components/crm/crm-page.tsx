"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Search, Sparkles, UserRoundCheck, UsersRound, Workflow } from "lucide-react";
import { CrmCard } from "@/components/crm/crm-card";
import { CrmColumn } from "@/components/crm/crm-column";
import { CrmDetailPanel } from "@/components/crm/crm-detail-panel";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferences } from "@/providers/preferences-provider";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import type { Company, CRMStatus, CrmBoard } from "@/types/domain";
import { formatCurrency } from "@/utils/format";

export default function CrmPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { dealValue } = usePreferences();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Company | null>(null);
  const [detail, setDetail] = useState<Company | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const boardQuery = useQuery({ queryKey: queryKeys.crm.board, queryFn: api.getCrmBoard });
  const board = boardQuery.data;
  const normalized = search.trim().toLocaleLowerCase("ru");
  const filtered = useMemo(() => {
    if (!board) return null;
    return { ...board, board: Object.fromEntries(STATUS_ORDER.map((status) => [status, (board.board[status] ?? []).filter((company) => !normalized || [company.name, company.category, company.city].some((value) => value?.toLocaleLowerCase("ru").includes(normalized))) ])) as CrmBoard["board"] };
  }, [board, normalized]);
  const all = board ? STATUS_ORDER.flatMap((status) => board.board[status] ?? []) : [];
  const clients = board?.board.client?.length ?? 0;
  const negotiations = board?.board.negotiation?.length ?? 0;
  const pipelineValue = (clients + negotiations) * dealValue;

  const moveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: CRMStatus; oldStatus: CRMStatus; note?: string }) => api.updateStatus(id, status, note),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crm.board });
      const previous = queryClient.getQueryData<CrmBoard>(queryKeys.crm.board);
      queryClient.setQueryData<CrmBoard>(queryKeys.crm.board, (current) => current ? moveCompany(current, id, status) : current);
      return { previous };
    },
    onError: (error, _variables, context) => { if (context?.previous) queryClient.setQueryData(queryKeys.crm.board, context.previous); toast({ title: "Карточка возвращена", description: (error as Error).message, tone: "error" }); },
    onSuccess: (_company, variables) => toast({ title: `Перемещено в «${STATUS_META[variables.status].label}»`, tone: "success", action: { label: "Отменить", onClick: () => { api.updateStatus(variables.id, variables.oldStatus, "Отмена перемещения").then(() => queryClient.invalidateQueries({ queryKey: queryKeys.crm.board })); } } }),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: queryKeys.crm.board }); queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }); queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); },
  });
  const commentMutation = useMutation({ mutationFn: ({ company, note }: { company: Company; note: string }) => api.updateStatus(company.id, company.status, note), onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.leads.statusHistory(detail?.id ?? 0) }); toast({ title: "Комментарий добавлен", tone: "success" }); }, onError: (error) => toast({ title: "Комментарий не сохранён", description: (error as Error).message, tone: "error" }) });

  const onDragStart = (event: DragStartEvent) => setActive(event.active.data.current?.company as Company);
  const onDragEnd = (event: DragEndEvent) => {
    const company = event.active.data.current?.company as Company | undefined;
    const overStatus = (event.over?.data.current?.status ?? (STATUS_ORDER.includes(event.over?.id as CRMStatus) ? event.over?.id : undefined)) as CRMStatus | undefined;
    setActive(null);
    if (!company || !overStatus || overStatus === company.status) return;
    moveMutation.mutate({ id: company.id, status: overStatus, oldStatus: company.status });
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Sales pipeline" title="CRM" description="Перетаскивайте лиды между этапами, фиксируйте контекст и управляйте следующими действиями." actions={<Link href="/search" className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-violet-600 px-3.5 text-sm font-medium text-white hover:bg-violet-700"><Sparkles className="h-4 w-4" />Добавить лиды</Link>} />
      <div className="grid gap-3 sm:grid-cols-3"><Metric icon={UsersRound} label="В воронке" value={`${all.length}`} /><Metric icon={UserRoundCheck} label="Переговоры и клиенты" value={`${negotiations + clients}`} /><Metric icon={CircleDollarSign} label="Pipeline value" value={formatCurrency(pipelineValue)} /></div>
      <div className="flex items-center gap-3"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Поиск по доске…" /></div><p className="hidden text-xs text-slate-400 sm:block">Drag & drop сохраняет статус автоматически</p></div>
      {boardQuery.isLoading ? <div className="flex gap-3 overflow-hidden">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[620px] w-[326px] shrink-0 rounded-2xl" />)}</div> : boardQuery.isError || !filtered ? <div className="rounded-2xl border border-slate-200 bg-white"><ErrorState message={(boardQuery.error as Error)?.message} onRetry={() => boardQuery.refetch()} /></div> : <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}><div className="no-scrollbar flex h-[calc(100vh-330px)] min-h-[580px] gap-3 overflow-x-auto pb-2">{filtered.columns.map((status) => <CrmColumn key={status} status={status} companies={filtered.board[status] ?? []} onOpen={setDetail} />)}</div><DragOverlay>{active ? <CrmCard company={active} overlay /> : null}</DragOverlay></DndContext>}
      <CrmDetailPanel company={detail} open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} statusLoading={moveMutation.isPending} onStatusChange={(status, note) => detail && moveMutation.mutate({ id: detail.id, status, oldStatus: detail.status, note })} commentLoading={commentMutation.isPending} onComment={(note) => detail && commentMutation.mutate({ company: detail, note })} />
    </div>
  );
}

function moveCompany(board: CrmBoard, id: number, status: CRMStatus): CrmBoard {
  let moved: Company | undefined;
  const next = Object.fromEntries(STATUS_ORDER.map((column) => [column, (board.board[column] ?? []).filter((company) => { if (company.id === id) { moved = company; return false; } return true; })])) as CrmBoard["board"];
  if (moved) next[status] = [{ ...moved, status }, ...(next[status] ?? [])];
  return { ...board, board: next };
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-0.5 text-lg font-semibold tracking-[-.03em] text-slate-900">{value}</p></div></div>; }
