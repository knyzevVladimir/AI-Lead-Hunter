"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { easeOutExpo, prefersReducedMotion, useInView } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number | undefined | null;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Animation length in ms. Default 1100. */
  duration?: number;
  /** Delay before counting starts, for staggering cards. */
  delay?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

const formatterCache = new Map<number, Intl.NumberFormat>();

function format(value: number, decimals: number): string {
  let f = formatterCache.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(decimals, f);
  }
  return f.format(value);
}

/**
 * Counts up to `value` with an ease-out curve when scrolled into view.
 *
 * Re-animates from the previously displayed number whenever `value` changes,
 * so a background refetch reads as the metric moving rather than a hard swap.
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1100,
  delay = 0,
  suffix,
  prefix,
  className,
}: AnimatedNumberProps) {
  const target = value ?? 0;
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.3 });
  const [display, setDisplay] = useState(0);

  // Where this run started from, so value changes tween rather than jump.
  const fromRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!inView) return;

    if (prefersReducedMotion()) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const start = fromRef.current;
    if (start === target) return;

    const run = () => {
      const t0 = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - t0) / duration, 1);
        const eased = easeOutExpo(progress);
        const current = start + (target - start) * eased;
        setDisplay(current);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          fromRef.current = target;
          frameRef.current = null;
        }
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(run, delay);
    } else {
      run();
    }

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      // Remember where we stopped so an interrupted run resumes smoothly.
      fromRef.current = display;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
    // `display` is intentionally excluded: including it would restart the
    // animation on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, duration, delay]);

  return (
    <span ref={ref} className={clsx("tabular-nums", className)}>
      {prefix}
      {format(display, decimals)}
      {suffix}
    </span>
  );
}
