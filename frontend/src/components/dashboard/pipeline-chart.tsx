"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { NamedValue } from "@/utils/analytics";

const colors = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#64748b", "#a1a1aa"];

export function PipelineChart({ data, centerLabel }: { data: NamedValue[]; centerLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="relative h-[210px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={66} outerRadius={86} paddingAngle={2} strokeWidth={0}>
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(value: number) => [value, "Лидов"]} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,.12)", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold tracking-[-.04em] text-slate-950 tabular-nums">{total}</span><span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{centerLabel}</span></div>
    </div>
  );
}

export function PipelineLegend({ data }: { data: NamedValue[] }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2">{data.slice(0, 6).map((item, index) => <div key={item.name} className="flex min-w-0 items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate text-slate-500">{item.name}</span><span className="font-semibold tabular-nums text-slate-800">{Math.round(item.value / total * 100)}%</span></div>)}</div>;
}
