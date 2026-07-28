"use client";

import clsx from "clsx";
import { useInView } from "@/lib/motion";
import AnimatedNumber from "@/components/motion/AnimatedNumber";

export interface FunnelStage {
  label: string;
  value: number;
  /** Tailwind gradient classes, e.g. "from-brand-500 to-brand-400". */
  gradient: string;
  hint?: string;
}

interface FunnelBarsProps {
  stages: FunnelStage[];
  className?: string;
}

/**
 * Horizontal conversion funnel.
 *
 * Bars are width-normalised against the largest stage and grow in with a
 * staggered scaleX transform; each row also reports its drop-off from the
 * previous stage, which is the number that actually drives decisions.
 */
export default function FunnelBars({ stages, className }: FunnelBarsProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div ref={ref} className={clsx("space-y-3", className)}>
      {stages.map((stage, i) => {
        const ratio = stage.value / max;
        const prev = i > 0 ? stages[i - 1].value : null;
        const dropOff =
          prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null;

        return (
          <div key={stage.label} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium text-white/80">
                {stage.label}
              </span>
              <span className="flex items-baseline gap-2">
                {dropOff !== null && (
                  <span
                    className={clsx(
                      "text-[10px] font-semibold tabular-nums",
                      dropOff >= 50
                        ? "text-green-400/70"
                        : dropOff >= 20
                          ? "text-amber-400/70"
                          : "text-red-400/70"
                    )}
                  >
                    {dropOff}%
                  </span>
                )}
                <AnimatedNumber
                  value={stage.value}
                  delay={i * 90}
                  className="text-sm font-bold text-white"
                />
              </span>
            </div>

            <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={clsx(
                  "h-full origin-left rounded-full bg-gradient-to-r",
                  stage.gradient
                )}
                style={{
                  width: `${Math.max(ratio * 100, stage.value > 0 ? 2 : 0)}%`,
                  transform: inView ? "scaleX(1)" : "scaleX(0)",
                  transition: `transform 900ms var(--ease-smooth) ${i * 90}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
