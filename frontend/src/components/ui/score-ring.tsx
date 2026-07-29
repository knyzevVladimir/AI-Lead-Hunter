import { cn } from "@/utils/cn";

export function scoreTone(score: number | null) {
  if (score === null) return { stroke: "#cbd5e1", text: "text-slate-400", bg: "bg-slate-50" };
  if (score >= 75) return { stroke: "#7c3aed", text: "text-violet-700", bg: "bg-violet-50" };
  if (score >= 50) return { stroke: "#2563eb", text: "text-blue-700", bg: "bg-blue-50" };
  if (score >= 25) return { stroke: "#d97706", text: "text-amber-700", bg: "bg-amber-50" };
  return { stroke: "#64748b", text: "text-slate-600", bg: "bg-slate-50" };
}

export function ScoreRing({ score, size = "md", className, showLabel = false }: { score: number | null; size?: "sm" | "md" | "lg" | "xl"; className?: string; showLabel?: boolean }) {
  const numeric = score ?? 0;
  const tone = scoreTone(score);
  const dimensions = { sm: 28, md: 36, lg: 48, xl: 84 };
  const d = dimensions[size];
  const strokeWidth = size === "xl" ? 6 : size === "sm" ? 2.5 : 3;
  const radius = d / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: d, height: d }} aria-label={score === null ? "AI Score не рассчитан" : `AI Score ${score}`}>
        <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} className="-rotate-90" aria-hidden>
          <circle cx={d / 2} cy={d / 2} r={radius} fill="none" stroke="#eef2f7" strokeWidth={strokeWidth} />
          <circle cx={d / 2} cy={d / 2} r={radius} fill="none" stroke={tone.stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - numeric / 100)} />
        </svg>
        <span className={cn("absolute font-bold tabular-nums", tone.text, size === "sm" ? "text-[9px]" : size === "md" ? "text-[11px]" : size === "lg" ? "text-sm" : "text-2xl")}>
          {score ?? "—"}
        </span>
      </span>
      {showLabel && <span className="text-xs font-medium text-slate-500">AI Score</span>}
    </span>
  );
}
