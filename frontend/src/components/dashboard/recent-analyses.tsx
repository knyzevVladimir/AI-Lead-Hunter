import Link from "next/link";
import { ArrowUpRight, ScanSearch } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/ui/score-ring";
import type { Company } from "@/types/domain";
import { formatRelativeTime } from "@/utils/format";

export function RecentAnalyses({ leads }: { leads: Company[] }) {
  const analyzed = leads.filter((lead) => lead.last_checked_at).sort((a, b) => +new Date(b.last_checked_at!) - +new Date(a.last_checked_at!)).slice(0, 5);
  if (!analyzed.length) return <EmptyState icon={ScanSearch} title="Анализов пока нет" description="Запустите AI-анализ для лидов, чтобы увидеть оценку и рекомендации." action={<Link href="/leads" className="text-xs font-semibold text-violet-600">Открыть лиды</Link>} />;
  return <div className="divide-y divide-slate-100">{analyzed.map((lead) => <Link key={lead.id} href={`/leads/${lead.id}`} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"><Avatar name={lead.name} size="md" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800 group-hover:text-violet-700">{lead.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{lead.category || "Без категории"} · {formatRelativeTime(lead.last_checked_at)}</p></div><ScoreRing score={lead.ai_score} size="sm" /><ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-violet-600" /></Link>)}</div>;
}
