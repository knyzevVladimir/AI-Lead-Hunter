import clsx from "clsx";

interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

/**
 * Colored pill for the AI lead score (0–100).
 *  >=80 -> green (горячий лид)
 *  60–79 -> amber
 *  40–59 -> slate
 *  1–39 -> gray
 *  null/0 -> neutral "—"
 */
export default function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const value = score ?? 0;

  if (score === null || score === undefined || value === 0) {
    return (
      <span
        className={clsx(
          "inline-flex min-w-[3rem] items-center justify-center rounded-md border border-line bg-slate-50 px-2 py-0.5 text-xs font-semibold text-faint",
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
    tone = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (value >= 60) {
    tone = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (value >= 40) {
    tone = "border-slate-200 bg-slate-50 text-slate-600";
  } else {
    tone = "border-slate-200 bg-slate-50 text-slate-500";
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
      <span className="opacity-50">/100</span>
    </span>
  );
}
