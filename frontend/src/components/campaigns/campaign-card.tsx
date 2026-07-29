import { CalendarDays, Mail, Radio, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Campaign, CampaignMessage } from "@/types/domain";
import { formatDate } from "@/utils/format";

export function CampaignCard({ campaign, messages }: { campaign: Campaign; messages: CampaignMessage[] }) {
  const related = messages.filter((message) => message.campaign_id === campaign.id);
  const sent = related.filter((message) => message.status === "sent").length;
  return <article className="min-w-[280px] flex-1 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,.05)]"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Mail className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-slate-900">{campaign.name}</h3><p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{campaign.channel}</p></div><Badge tone={campaign.status === "active" ? "emerald" : "neutral"} dot>{campaign.status === "active" ? "Активна" : campaign.status}</Badge></div><div className="mt-5 grid grid-cols-3 gap-2"><Metric icon={Send} label="Сообщений" value={related.length} /><Metric icon={Radio} label="Отправлено" value={sent} /><Metric icon={CalendarDays} label="Follow-up" value={campaign.followup_days || "—"} /></div><p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">Создана {formatDate(campaign.created_at)}</p></article>;
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) { return <div className="rounded-xl bg-slate-50 p-2.5"><Icon className="h-3.5 w-3.5 text-slate-400" /><p className="mt-2 text-sm font-semibold tabular-nums text-slate-800">{value}</p><p className="mt-0.5 truncate text-[9px] text-slate-400">{label}</p></div>; }
