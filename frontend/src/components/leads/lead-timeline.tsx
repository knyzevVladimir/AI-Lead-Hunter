import { Mail, MessageSquareText, RefreshCw, Workflow } from "lucide-react";
import { STATUS_META } from "@/theme/constants";
import type { CampaignMessage, ChangeHistory, StatusHistory } from "@/types/domain";
import { formatDateTime } from "@/utils/format";

interface TimelineEntry { id: string; date: string; title: string; description: string; type: "status" | "change" | "message" }

export function LeadTimeline({ statuses, changes, messages }: { statuses: StatusHistory[]; changes: ChangeHistory[]; messages: CampaignMessage[] }) {
  const entries: TimelineEntry[] = [
    ...statuses.map((item) => ({ id: `s-${item.id}`, date: item.created_at, title: `Статус: ${STATUS_META[item.new_status]?.label ?? item.new_status}`, description: item.note || `${item.old_status ? STATUS_META[item.old_status]?.label : "Начало"} → ${STATUS_META[item.new_status]?.label ?? item.new_status}`, type: "status" as const })),
    ...changes.map((item) => ({ id: `c-${item.id}`, date: item.created_at, title: `Изменено поле «${item.field}»`, description: item.note || `${item.old_value || "—"} → ${item.new_value || "—"}`, type: "change" as const })),
    ...messages.map((item) => ({ id: `m-${item.id}`, date: item.created_at, title: item.status === "sent" ? "Сообщение отправлено" : "Создан черновик", description: item.subject || item.body.slice(0, 100), type: "message" as const })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  if (!entries.length) return <div className="py-10 text-center text-sm text-slate-400">История действий пока пуста.</div>;
  return <div className="relative ml-2 border-l border-slate-200 pl-5">{entries.map((entry, index) => { const Icon = entry.type === "status" ? Workflow : entry.type === "change" ? RefreshCw : entry.title.includes("отправлено") ? Mail : MessageSquareText; return <div key={entry.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-500 ring-1 ring-slate-200"><Icon className="h-2.5 w-2.5" /></span><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold text-slate-800">{entry.title}</p><p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-400">{entry.description}</p></div><time className="shrink-0 text-[10px] text-slate-400">{formatDateTime(entry.date)}</time></div></div>; })}</div>;
}
