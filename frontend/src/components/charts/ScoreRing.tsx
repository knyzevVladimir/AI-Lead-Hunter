"use client";

import { useId } from "react";
import clsx from "clsx";
import { useInView } from "@/lib/motion";

interface ScoreRingProps {
  /** 0–100. `null`/`undefined` renders the empty state. */
  score: number | null | undefined;
  size?: number;
  stroke?: number;
  /** Stagger the sweep when several rings share a view. */
  delay?: number;
  className?: string;
}

/** Same colour bands as ScoreBadge, so the two always agree. */
export function scoreColors(value: number): { from: string; to: string } {
  if (value >= 80) return { from: "#f97316", to: "#ef4444" };
  if (value >= 60) return { from: "#fbbf24", to: "#f97316" };
  if (value >= 40) return { from: "#38bdf8", to: "#fbbf24" };
  return { from: "#64748b", to: "#38bdf8" };
}

/**
 * Circular AI-score gauge. The arc sweeps from zero when it enters the
 * viewport via a stroke-dashoffset transition.
 */
export default function ScoreRing({
  score,
  size = 48,
  stroke = 4,
  delay = 0,
  className,
}: ScoreRingProps) {
  const id = useId().replace(/:/g, "");
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });

  const value = Math.max(0, Math.min(100, score ?? 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const { from, to } = scoreColors(value);
  const empty = score === null || score === undefined || value === 0;

  return (
    <div
      ref={ref}
      className={clsx("relative shrink-0", className)}
      style={{ width: size, height: size }}
      title={empty ? "Нет оценки" : `AI-оценка: ${value}/100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />

        {!empty && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#ring-${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={inView ? offset : circumference}
            style={{
              transition: `stroke-dashoffset 1200ms var(--ease-smooth) ${delay}ms`,
            }}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[11px] font-bold tabular-nums text-white"
          style={{ fontSize: Math.max(10, size * 0.24) }}
        >
          {empty ? "—" : value}
        </span>
      </div>
    </div>
  );
}
