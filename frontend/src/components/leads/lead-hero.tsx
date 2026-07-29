import Link from "next/link";
import { ArrowLeft, Eye, Globe2, Mail, MapPin, Phone, ScanSearch, Sparkles, Star, Workflow } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { SourceBadge } from "@/components/leads/source-badge";
import { StatusBadge } from "@/components/leads/status-badge";
import type { CompanyDetail } from "@/types/domain";
import { shortUrl } from "@/utils/format";

export function LeadHero({ company, onAnalyze, analyzeLoading, onOffer, onStatus, onMonitor, monitorLoading }: { company: CompanyDetail; onAnalyze: () => void; analyzeLoading: boolean; onOffer: () => void; onStatus: () => void; onMonitor: () => void; monitorLoading: boolean }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_38px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-100 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,.09),transparent_48%)] p-5 sm:p-7">
        <Link href="/leads" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" />К списку лидов</Link>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4"><Avatar name={company.name} size="xl" className="rounded-2xl" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-[-.035em] text-slate-950 sm:text-3xl">{company.name}</h1><StatusBadge status={company.status} />{company.monitored && <Badge tone="cyan"><Eye className="h-3 w-3" />Мониторинг</Badge>}</div><p className="mt-2 text-sm text-slate-500">{company.category || "Без категории"}</p><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">{(company.address || company.city) && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-300" />{company.address || company.city}</span>}{company.rating !== null && <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{company.rating.toFixed(1)} · {company.reviews_count ?? 0} отзывов</span>}<SourceBadge source={company.source} /></div></div></div>
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur"><ScoreRing score={company.ai_score} size="xl" /><div><p className="text-xs font-semibold text-slate-800">AI Opportunity Score</p><p className="mt-1 max-w-[180px] text-[10px] leading-4 text-slate-400">Чем выше оценка, тем больше цифровых пробелов и потенциал продажи услуг.</p></div></div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">{company.phone && <a href={`tel:${company.phone}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-slate-300"><Phone className="h-3.5 w-3.5" />{company.phone}</a>}{company.email && <a href={`mailto:${company.email}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-slate-300"><Mail className="h-3.5 w-3.5" />{company.email}</a>}{company.website && <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-slate-300"><Globe2 className="h-3.5 w-3.5" />{shortUrl(company.website)}</a>}</div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={onMonitor} loading={monitorLoading}><Eye className="h-4 w-4" />{company.monitored ? "Отключить" : "Мониторить"}</Button><Button variant="secondary" onClick={onStatus}><Workflow className="h-4 w-4" />Статус</Button><Button variant="secondary" onClick={onAnalyze} loading={analyzeLoading}><ScanSearch className="h-4 w-4" />Анализ</Button><Button onClick={onOffer}><Sparkles className="h-4 w-4" />Предложение</Button></div>
      </div>
    </section>
  );
}
