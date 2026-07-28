"use client";

import clsx from "clsx";

interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

/**
 * Colored pill for the AI lead score (0–100).
 *  >=80 -> red-orange gradient (горячий лид) + glow
 *  60–79 -> orange-amber gradient
 *  40–59 -> amber-sky gradient
 *  1–39  -> slate-blue gradient
 *  null/0 -> gray "—"
 *
 * Public API is unchanged: default export, { score, className } props.
 */
export default function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const value = score ?? 0;

  if (score === null || score === undefined || value === 0) {
    return (
      <span
        className={clsx(
          "inline-flex min-w-[3rem] items-center justify-center rounded-md",
          "border border-white/10 bg-white/5 px-2 py-0.5",
          "text-xs font-semibold text-muted",
          "transition-colors duration-300",
          className
        )}
        title="Нет оценки"
      >
        —
      </span>
    );
  }

  /* Gradient fill + text colours matched to the same bands as ScoreRing. */
  let gradientStyle: React.CSSProperties;
  let borderClass: string;
  let textClass: string;
  let glowStyle: React.CSSProperties | undefined;

  if (value >= 80) {
    /* Hot lead — warm gradient from orange to red, visible glow. */
    gradientStyle = {
      background:
        "linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(239,68,68,0.18) 100%)",
    };
    borderClass = "border-red-500/50";
    textClass = "text-red-200";
    glowStyle = {
      boxShadow: "0 0 14px -4px rgba(239,68,68,0.55)",
    };
  } else if (value >= 60) {
    gradientStyle = {
      background:
        "linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(249,115,22,0.18) 100%)",
    };
    borderClass = "border-orange-500/40";
    textClass = "text-orange-200";
    glowStyle = undefined;
  } else if (value >= 40) {
    gradientStyle = {
      background:
        "linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(251,191,36,0.18) 100%)",
    };
    borderClass = "border-amber-500/35";
    textClass = "text-amber-200";
    glowStyle = undefined;
  } else {
    gradientStyle = {
      background:
        "linear-gradient(135deg, rgba(100,116,139,0.2) 0%, rgba(56,189,248,0.14) 100%)",
    };
    borderClass = "border-slate-500/35";
    textClass = "text-slate-300";
    glowStyle = undefined;
  }

  return (
    <span
      className={clsx(
        "inline-flex min-w-[3rem] items-center justify-center gap-0.5",
        "rounded-md border px-2 py-0.5",
        "text-xs font-semibold tabular-nums",
        /* Smooth colour transitions when score updates after an analysis run. */
        "transition-all duration-500 ease-smooth",
        borderClass,
        textClass,
        className
      )}
      style={{ ...gradientStyle, ...glowStyle }}
      title={value >= 80 ? "Горячий лид" : `AI-оценка: ${value}/100`}
    >
      {value}
      <span className="opacity-50">/100</span>
    </span>
  );
}
