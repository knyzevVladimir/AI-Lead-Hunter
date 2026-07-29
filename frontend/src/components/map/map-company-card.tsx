import Link from "next/link";
import { ArrowUpRight, Eye, Globe2, Mail, MapPin, Phone, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge } from "@/components/leads/status-badge";
import type { Company } from "@/types/domain";
import { shortUrl } from "@/utils/format";

export function MapCompanyCard({ company, compact = false }: { company: Company; compact?: boolean }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3"><Avatar name={company.name} size="lg" /><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-slate-900">{company.name}</h3><p className="mt-0.5 truncate text-xs text-slate-400">{company.category || "Без категории"}</p></div><ScoreRing score={company.ai_score} size="md" /></div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />{company.address || company.city || "Адрес не указан"}</p>
      {!compact && <><div className="mt-3 flex flex-wrap gap-1.5"><StatusBadge status={company.status} />{company.rating !== null && <Badge tone={company.rating < 4 ? "amber" : "neutral"}><Star className="h-3 w-3 fill-current" />{company.rating.toFixed(1)}</Badge>}{company.monitored && <Badge tone="cyan"><Eye className="h-3 w-3" />Мониторинг</Badge>}</div><div className="mt-3 grid gap-1.5 text-[11px] text-slate-500"><p className="flex items-center gap-2"><Globe2 className={`h-3.5 w-3.5 ${company.website ? "text-emerald-500" : "text-rose-400"}`} /><span className={company.website ? "truncate" : "font-medium text-rose-600"}>{company.website ? shortUrl(company.website) : "Сайт отсутствует"}</span></p>{company.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-300" />{company.phone}</p>}{company.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-300" />{company.email}</p>}</div></>}
      <Link href={`/leads/${company.id}`} className="mt-4 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-medium text-white transition hover:bg-violet-700">Открыть лид<ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
