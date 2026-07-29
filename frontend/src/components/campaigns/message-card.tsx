import Link from "next/link";
import { ArrowUpRight, CalendarDays, Mail, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CampaignMessage, Company } from "@/types/domain";
import { formatDateTime } from "@/utils/format";

const statusTone = { draft: "neutral", queued: "amber", sent: "blue", replied: "emerald", failed: "rose" } as const;
const statusLabel = { draft: "Черновик", queued: "В очереди", sent: "Отправлено", replied: "Ответ", failed: "Ошибка" } as const;

export function MessageCard({ message, company, onOpen, onSend, sending }: { message: CampaignMessage; company?: Company; onOpen: () => void; onSend: () => void; sending: boolean }) {
  return <article className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,.05)]"><div className="flex items-start gap-3"><Avatar name={company?.name || `Lead ${message.company_id}`} size="md" /><div className="min-w-0 flex-1"><Link href={`/leads/${message.company_id}`} className="truncate text-xs font-semibold text-slate-800 hover:text-violet-700">{company?.name || `Лид #${message.company_id}`}</Link><p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400"><Mail className="h-3 w-3" />{message.channel} · шаг {message.followup_step}</p></div><Badge tone={statusTone[message.status]}>{statusLabel[message.status]}</Badge></div><button type="button" onClick={onOpen} className="mt-4 block w-full text-left"><p className="truncate text-sm font-semibold text-slate-900">{message.subject || "Без темы"}</p><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{message.body}</p></button><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarDays className="h-3 w-3" />{formatDateTime(message.created_at)}</span><div className="flex items-center gap-1">{message.status === "draft" && <Button variant="ghost" size="sm" onClick={onSend} loading={sending}><Send className="h-3.5 w-3.5" />Отправить</Button>}<button type="button" onClick={onOpen} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-violet-600 hover:bg-violet-50">Открыть<ArrowUpRight className="h-3 w-3" /></button></div></div></article>;
}
