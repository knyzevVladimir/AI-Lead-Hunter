import Link from "next/link";
import { ArrowUpRight, Globe2, Mail, MapPin, Phone, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { SourceBadge } from "@/components/leads/source-badge";
import type { CompanyDetail } from "@/types/domain";
import { cn } from "@/utils/cn";
import { shortUrl } from "@/utils/format";

export function SearchResultCard({ company }: { company: CompanyDetail }) {
  return (
    <Link href={`/leads/${company.id}`} className="group flex min-h-[230px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.03)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_38px_rgba(15,23,42,.07)]">
      <div className="flex items-start gap-3">
        <Avatar name={company.name} size="lg" />
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-violet-700">{company.name}</h3><p className="mt-0.5 truncate text-xs text-slate-400">{company.category || "Без категории"}</p></div>
        <ScoreRing score={company.ai_score} size="md" />
      </div>
      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <p className="flex min-w-0 items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" /><span className="truncate">{company.address || company.city || "Адрес не указан"}</span></p>
        <p className="flex min-w-0 items-center gap-2"><Globe2 className={cn("h-3.5 w-3.5 shrink-0", company.website ? "text-emerald-500" : "text-rose-400")} /><span className={cn("truncate", !company.website && "font-medium text-rose-600")}>{company.website ? shortUrl(company.website) : "Сайт отсутствует"}</span></p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <SourceBadge source={company.source} />
        {company.rating !== null && <Badge tone={company.rating < 4 ? "amber" : "neutral"}><Star className="h-3 w-3 fill-current" />{company.rating.toFixed(1)} · {company.reviews_count ?? 0}</Badge>}
        <Badge tone={company.email ? "emerald" : "neutral"}>{company.email ? <Mail className="h-3 w-3" /> : <Mail className="h-3 w-3 opacity-40" />}{company.email ? "Email" : "Нет email"}</Badge>
        {company.phone && <Badge><Phone className="h-3 w-3" />Телефон</Badge>}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400"><span>{company.ai_score === null ? "Требуется AI-анализ" : `AI opportunity ${company.ai_score}/100`}</span><span className="inline-flex items-center gap-1 font-semibold text-violet-600 opacity-0 transition group-hover:opacity-100">Открыть<ArrowUpRight className="h-3 w-3" /></span></div>
    </Link>
  );
}
