import Link from "next/link";
import { Ellipsis, Eye, Globe2, Mail, MapPin, Phone, ScanSearch, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownItem, DropdownMenu, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { ScoreRing } from "@/components/ui/score-ring";
import { Spinner } from "@/components/ui/spinner";
import { SourceBadge } from "@/components/leads/source-badge";
import { StatusBadge } from "@/components/leads/status-badge";
import type { Company } from "@/types/domain";
import { cn } from "@/utils/cn";
import { formatRelativeTime, shortUrl } from "@/utils/format";

export function LeadGridRow({ company, selected, onSelectedChange, onAnalyze, onOffer, onMonitor, pendingAction }: {
  company: Company;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  onAnalyze: () => void;
  onOffer: () => void;
  onMonitor: () => void;
  pendingAction?: "analyze" | "monitor" | null;
}) {
  return (
    <>
      <div className={cn("group hidden min-h-[72px] grid-cols-[36px_minmax(230px,1.45fr)_minmax(190px,1fr)_minmax(150px,.8fr)_90px_150px_115px_44px] items-center gap-3 border-b border-slate-100 px-4 transition last:border-b-0 hover:bg-slate-50/80 lg:grid", selected && "bg-violet-50/60 hover:bg-violet-50")}>
        <Checkbox checked={selected} onCheckedChange={onSelectedChange} label={`Выбрать ${company.name}`} />
        <div className="flex min-w-0 items-center gap-3"><Avatar name={company.name} size="md" /><div className="min-w-0"><Link href={`/leads/${company.id}`} className="block truncate text-xs font-semibold text-slate-900 hover:text-violet-700">{company.name}</Link><p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400"><MapPin className="h-3 w-3 shrink-0" />{company.city || company.address || "Адрес не указан"}</p></div></div>
        <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-600">{company.category || "Без категории"}</p><p className="mt-1 truncate text-[10px] text-slate-400">{company.address || company.country || "—"}</p></div>
        <div className="min-w-0 space-y-1 text-[10px]"><p className="flex items-center gap-1.5 truncate text-slate-500"><Globe2 className={cn("h-3 w-3 shrink-0", company.website ? "text-emerald-500" : "text-rose-400")} /><span className={cn("truncate", !company.website && "font-medium text-rose-600")}>{company.website ? shortUrl(company.website) : "Нет сайта"}</span></p><p className="flex items-center gap-1.5 truncate text-slate-400">{company.phone ? <Phone className="h-3 w-3 shrink-0" /> : <Mail className="h-3 w-3 shrink-0" />}<span className="truncate">{company.phone || company.email || "Нет контактов"}</span></p></div>
        <ScoreRing score={company.ai_score} size="md" />
        <StatusBadge status={company.status} />
        <div className="text-[10px] text-slate-400">{pendingAction === "analyze" ? <span className="inline-flex items-center gap-1.5 text-violet-600"><Spinner className="h-3.5 w-3.5" />Анализ</span> : company.last_checked_at ? formatRelativeTime(company.last_checked_at) : <button type="button" onClick={onAnalyze} className="font-medium text-violet-600 hover:text-violet-700">Запустить</button>}</div>
        <SourceBadge source={company.source} />
        <DropdownMenu trigger={<button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-800 group-hover:opacity-100" aria-label="Действия"><Ellipsis className="h-4 w-4" /></button>}>
          <DropdownItem icon={ScanSearch} onClick={onAnalyze}>Запустить анализ</DropdownItem><DropdownItem icon={Sparkles} onClick={onOffer}>Создать предложение</DropdownItem><DropdownSeparator /><DropdownItem icon={Eye} onClick={onMonitor}>{company.monitored ? "Отключить мониторинг" : "Включить мониторинг"}</DropdownItem>
        </DropdownMenu>
      </div>

      <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden", selected && "border-violet-300 bg-violet-50/40")}>
        <div className="flex items-start gap-3"><Checkbox checked={selected} onCheckedChange={onSelectedChange} label={`Выбрать ${company.name}`} className="mt-1" /><Avatar name={company.name} size="lg" /><div className="min-w-0 flex-1"><Link href={`/leads/${company.id}`} className="block truncate text-sm font-semibold text-slate-900">{company.name}</Link><p className="mt-0.5 truncate text-xs text-slate-400">{company.category || "Без категории"}</p></div><ScoreRing score={company.ai_score} size="md" /></div>
        <div className="mt-4 grid gap-2 text-xs text-slate-500"><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />{company.address || company.city || "Адрес не указан"}</p><p className="flex items-center gap-2"><Globe2 className={cn("h-3.5 w-3.5", company.website ? "text-emerald-500" : "text-rose-400")} />{company.website ? shortUrl(company.website) : "Нет сайта"}</p>{company.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-300" />{company.phone}</p>}</div>
        <div className="mt-4 flex flex-wrap gap-1.5"><StatusBadge status={company.status} /><SourceBadge source={company.source} />{company.monitored && <Badge tone="cyan"><Eye className="h-3 w-3" />Мониторинг</Badge>}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={onAnalyze} disabled={pendingAction === "analyze"} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 disabled:opacity-50">{pendingAction === "analyze" ? <Spinner /> : <ScanSearch className="h-3.5 w-3.5" />}Анализ</button><button type="button" onClick={onOffer} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 text-xs font-medium text-white"><Sparkles className="h-3.5 w-3.5" />Предложение</button></div>
      </div>
    </>
  );
}
