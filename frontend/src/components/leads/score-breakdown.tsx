import { AlertCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SERVICE_LABELS } from "@/theme/constants";

export function ScoreBreakdown({ breakdown, services }: { breakdown: Record<string, number>; services: string[] }) {
  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return <div className="grid gap-6 lg:grid-cols-2"><div><p className="mb-4 text-xs font-semibold text-slate-800">Почему такой Score</p>{entries.length ? <div className="space-y-3">{entries.map(([label, value]) => <div key={label}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-600"><AlertCircle className="h-3.5 w-3.5 text-amber-500" />{label}</span><span className="font-semibold tabular-nums text-slate-800">+{value}</span></div><Progress value={value / max * 100} className="h-1" indicatorClassName="bg-amber-500" /></div>)}</div> : <p className="text-sm text-slate-400">Факторы риска не обнаружены.</p>}</div><div><p className="mb-4 text-xs font-semibold text-slate-800">Какие услуги предложить</p>{services.length ? <div className="grid gap-2 sm:grid-cols-2">{services.map((service) => <div key={service} className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 text-xs font-medium text-violet-800"><Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-600" />{SERVICE_LABELS[service] ?? service}</div>)}</div> : <p className="text-sm text-slate-400">Рекомендации появятся после анализа.</p>}</div></div>;
}
