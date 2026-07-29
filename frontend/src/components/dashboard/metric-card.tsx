import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

export function MetricCard({ label, value, description, icon: Icon, trend, sparkline, loading, accent = "violet" }: {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: number;
  sparkline?: number[];
  loading?: boolean;
  accent?: "violet" | "blue" | "emerald" | "amber" | "slate";
}) {
  const accents = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="group relative overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(15,23,42,.06)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 text-[27px] font-semibold tracking-[-0.04em] text-slate-950 tabular-nums">{value}</p>}
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", accents[accent])}><Icon className="h-[17px] w-[17px]" /></span>
      </div>
      <div className="mt-4 flex min-h-6 items-end justify-between gap-3">
        {loading ? <Skeleton className="h-4 w-28" /> : (
          <div className="min-w-0 text-[11px] text-slate-400">
            {trend !== undefined && <span className={cn("mr-1.5 inline-flex items-center gap-0.5 font-semibold", trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-slate-500")}>{trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{Math.abs(trend).toFixed(0)}%</span>}
            <span className="truncate">{description}</span>
          </div>
        )}
        {sparkline && sparkline.length > 1 && <MiniSparkline values={sparkline} color={accent === "emerald" ? "#10b981" : accent === "blue" ? "#3b82f6" : accent === "amber" ? "#f59e0b" : "#8b5cf6"} />}
      </div>
    </Card>
  );
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 74},${24 - ((value - min) / range) * 20}`).join(" ");
  return <motion.svg width="76" height="26" viewBox="0 0 76 26" initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-hidden><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>;
}
