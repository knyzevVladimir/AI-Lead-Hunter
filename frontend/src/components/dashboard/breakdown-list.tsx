import { Progress } from "@/components/ui/progress";
import type { NamedValue } from "@/utils/analytics";

export function BreakdownList({ data, emptyLabel = "Недостаточно данных" }: { data: NamedValue[]; emptyLabel?: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  if (!data.length) return <p className="py-8 text-center text-sm text-slate-400">{emptyLabel}</p>;
  return <div className="space-y-3.5">{data.map((item, index) => <div key={item.name}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-medium text-slate-600"><span className="mr-2 text-slate-300">{String(index + 1).padStart(2, "0")}</span>{item.name}</span><span className="font-semibold tabular-nums text-slate-800">{item.value}</span></div><Progress value={item.value / max * 100} className="h-1" indicatorClassName={index === 0 ? "bg-violet-600" : index === 1 ? "bg-blue-500" : "bg-slate-400"} /></div>)}</div>;
}
