import Link from "next/link";
import { Bot, Building2, Mail, ScanLine } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CampaignMessage, Company } from "@/types/domain";
import { formatRelativeTime } from "@/utils/format";

export function RecentActivity({ leads, messages }: { leads: Company[]; messages: CampaignMessage[] }) {
  const entries = [
    ...leads.slice(0, 5).map((lead) => ({ id: `lead-${lead.id}`, date: lead.created_at, type: "lead" as const, lead })),
    ...messages.slice(0, 5).map((message) => ({ id: `message-${message.id}`, date: message.created_at, type: "message" as const, message })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 7);

  if (!entries.length) return <div className="py-12 text-center text-sm text-slate-400">Активность появится после первого поиска.</div>;
  return <div className="divide-y divide-slate-100">{entries.map((entry) => entry.type === "lead" ? (
    <Link key={entry.id} href={`/leads/${entry.lead.id}`} className="flex items-center gap-3 py-3 transition first:pt-0 last:pb-0 hover:opacity-75"><Avatar name={entry.lead.name} size="md" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-800">Добавлен новый лид</p><p className="truncate text-[11px] text-slate-400">{entry.lead.name} · {entry.lead.city ?? "город не указан"}</p></div><Badge tone="blue"><Building2 className="h-3 w-3" />Lead</Badge><time className="hidden whitespace-nowrap text-[10px] text-slate-400 sm:block">{formatRelativeTime(entry.date)}</time></Link>
  ) : (
    <div key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Mail className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-800">{entry.message.status === "sent" ? "Сообщение отправлено" : "Создан черновик сообщения"}</p><p className="truncate text-[11px] text-slate-400">Лид #{entry.message.company_id} · {entry.message.subject || "Без темы"}</p></div><Badge tone={entry.message.status === "sent" ? "emerald" : "violet"}>{entry.message.status === "sent" ? <ScanLine className="h-3 w-3" /> : <Bot className="h-3 w-3" />}{entry.message.status === "sent" ? "Sent" : "Draft"}</Badge><time className="hidden whitespace-nowrap text-[10px] text-slate-400 sm:block">{formatRelativeTime(entry.date)}</time></div>
  ))}</div>;
}
