"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Mail, MapPin, Phone, Send, Workflow } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { ScoreRing } from "@/components/ui/score-ring";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import type { Company, CRMStatus } from "@/types/domain";
import { formatDateTime } from "@/utils/format";
import { useEffect, useState } from "react";

export function CrmDetailPanel({ company, open, onOpenChange, onStatusChange, statusLoading, onComment, commentLoading }: { company: Company | null; open: boolean; onOpenChange: (open: boolean) => void; onStatusChange: (status: CRMStatus, note?: string) => void; statusLoading: boolean; onComment: (note: string) => void; commentLoading: boolean }) {
  const [status, setStatus] = useState<CRMStatus>(company?.status ?? "new");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  useEffect(() => { if (company) { setStatus(company.status); setNote(""); setComment(""); } }, [company]);
  const historyQuery = useQuery({ queryKey: queryKeys.leads.statusHistory(company?.id ?? 0), queryFn: () => api.getStatusHistory(company!.id), enabled: open && Boolean(company) });
  if (!company) return null;
  return <Dialog open={open} onOpenChange={onOpenChange} title="Карточка сделки" description="Статус, комментарии и история взаимодействия" size="lg" footer={<Link href={`/leads/${company.id}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-slate-950 px-3.5 text-sm font-medium text-white hover:bg-violet-700">Полная карточка<ArrowUpRight className="h-4 w-4" /></Link>}>
    <div className="space-y-6">
      <div className="flex items-start gap-4"><Avatar name={company.name} size="xl" /><div className="min-w-0 flex-1"><h3 className="text-lg font-semibold tracking-[-.02em] text-slate-900">{company.name}</h3><p className="mt-1 text-sm text-slate-400">{company.category || "Без категории"}</p><div className="mt-3 flex flex-wrap gap-2">{company.city && <Badge><MapPin className="h-3 w-3" />{company.city}</Badge>}{company.phone && <Badge><Phone className="h-3 w-3" />Телефон</Badge>}{company.email && <Badge tone="emerald"><Mail className="h-3 w-3" />Email</Badge>}</div></div><ScoreRing score={company.ai_score} size="lg" /></div>
      <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_1.4fr_auto]"><div><Label>CRM-статус</Label><Select value={status} onChange={(event) => setStatus(event.target.value as CRMStatus)}>{STATUS_ORDER.map((item) => <option key={item} value={item}>{STATUS_META[item].label}</option>)}</Select></div><div><Label>Комментарий к изменению</Label><Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-10 resize-none" placeholder="Контекст для команды…" /></div><Button className="self-end" loading={statusLoading} onClick={() => onStatusChange(status, note.trim() || undefined)}><Workflow className="h-4 w-4" />Обновить</Button></div>
      <div><Label>Добавить комментарий</Label><div className="flex items-end gap-2"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-20" placeholder="Заметка о звонке, следующем шаге или договорённости…" /><Button size="icon" disabled={!comment.trim()} loading={commentLoading} onClick={() => { onComment(comment.trim()); setComment(""); }} aria-label="Добавить комментарий"><Send className="h-4 w-4" /></Button></div><p className="mt-1.5 text-[10px] text-slate-400">Комментарий сохраняется в истории через существующий CRM API.</p></div>
      <div><h4 className="text-xs font-semibold text-slate-800">История</h4><div className="mt-4 space-y-4 border-l border-slate-200 pl-5">{historyQuery.isLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12" />) : historyQuery.data?.length ? historyQuery.data.map((item) => <div key={item.id} className="relative"><span className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-violet-500 ring-4 ring-white" /><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-700">{STATUS_META[item.old_status ?? "new"]?.label ?? "Начало"} → {STATUS_META[item.new_status]?.label}</p>{item.note && <p className="mt-1 text-[11px] leading-5 text-slate-500">{item.note}</p>}</div><time className="whitespace-nowrap text-[10px] text-slate-400">{formatDateTime(item.created_at)}</time></div></div>) : <p className="py-4 text-xs text-slate-400">История появится после первого изменения статуса.</p>}</div></div>
    </div>
  </Dialog>;
}
