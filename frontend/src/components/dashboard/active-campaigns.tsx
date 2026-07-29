import Link from "next/link";
import { ArrowUpRight, CalendarDays, Mail, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Campaign } from "@/types/domain";
import { formatDate } from "@/utils/format";

export function ActiveCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  const active = campaigns.filter((campaign) => campaign.status === "active").slice(0, 4);
  if (!active.length) return <EmptyState icon={Radio} title="Нет активных кампаний" description="Создайте кампанию и подготовьте персонализированную последовательность касаний." action={<Link href="/campaigns" className="text-xs font-semibold text-violet-600 hover:text-violet-700">Перейти к кампаниям</Link>} />;
  return <div className="divide-y divide-slate-100">{active.map((campaign) => <Link key={campaign.id} href="/campaigns" className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Mail className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800 group-hover:text-violet-700">{campaign.name}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400"><CalendarDays className="h-3 w-3" />{formatDate(campaign.created_at)} · follow-up {campaign.followup_days || "—"} дн.</p></div><Badge tone="emerald" dot>Активна</Badge><ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-violet-600" /></Link>)}</div>;
}
