"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/utils/analytics";

export function AcquisitionChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.24} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
            <linearGradient id="analysisGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.16} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eef2f7" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} minTickGap={24} dy={8} />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
          <Area type="monotone" dataKey="leads" name="Новые лиды" stroke="#7c3aed" strokeWidth={2.2} fill="url(#leadsGradient)" activeDot={{ r: 4, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="analyzed" name="Анализы" stroke="#0891b2" strokeWidth={1.8} fill="url(#analysisGradient)" activeDot={{ r: 4, fill: "#0891b2", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>{payload.map((entry) => <div key={entry.name} className="flex min-w-36 items-center justify-between gap-6 py-0.5 text-xs"><span className="flex items-center gap-2 text-slate-500"><span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />{entry.name}</span><span className="font-semibold tabular-nums text-slate-900">{entry.value}</span></div>)}</div>;
}
