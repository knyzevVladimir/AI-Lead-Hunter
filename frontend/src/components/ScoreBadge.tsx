import clsx from "clsx";

interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

/**
 * Colored pill for the AI lead score (0–100).
 *  >=80 -> red (горячий лид)
 *  60–79 -> orange
 *  40–59 -> amber
 *  1–39 -> slate
 *  null/0 -> gray "—"
 */
export default function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const value = score ?? 0;

  if (score === null || score === undefined || value === 0) {
    return (
      <span
        className={clsx(
          "inline-flex min-w-[3rem] items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-muted",
          className
        )}
        title="Нет оценки"
      >
        —
      </span>
    );
  }

  let tone: string;
  if (value >= 80) {
    tone = "border-red-500/40 bg-red-500/15 text-red-300";
  } else if (value >= 60) {
    tone = "border-orange-500/40 bg-orange-500/15 text-orange-300";
  } else if (value >= 40) {
    tone = "border-amber-500/40 bg-amber-500/15 text-amber-300";
  } else {
    tone = "border-slate-500/40 bg-slate-500/15 text-slate-300";
  }

  return (
    <span
      className={clsx(
        "inline-flex min-w-[3rem] items-center justify-center gap-0.5 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className
      )}
      title={value >= 80 ? "Горячий лид" : `AI-оценка: ${value}/100`}
    >
      {value}
      <span className="opacity-60">/100</span>
    </span>
  );
}
