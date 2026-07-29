import type { NamedValue } from "@/utils/analytics";

const colors = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#64748b", "#a1a1aa"];

export function PipelineLegend({ data }: { data: NamedValue[] }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2">{data.slice(0, 6).map((item, index) => <div key={item.name} className="flex min-w-0 items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate text-slate-500">{item.name}</span><span className="font-semibold tabular-nums text-slate-800">{Math.round(item.value / total * 100)}%</span></div>)}</div>;
}
