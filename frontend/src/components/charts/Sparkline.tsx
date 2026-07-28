"use client";

import { useId } from "react";
import clsx from "clsx";
import { useInView } from "@/lib/motion";

interface SparklineProps {
  data: number[];
  /** Stroke colour, any CSS colour. */
  color?: string;
  height?: number;
  /** Fill the area under the curve with a fading gradient. */
  area?: boolean;
  /** Delay the draw-in, for staggering across a grid of cards. */
  delay?: number;
  className?: string;
}

/**
 * Catmull-Rom through the points, emitted as a cubic bezier path.
 * Gives a smooth curve without the overshoot a naive quadratic fit produces.
 */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Compact trend line that draws itself in when scrolled into view.
 *
 * The draw-in is a stroke-dashoffset transition, so it runs on the compositor
 * and costs nothing per frame.
 */
export default function Sparkline({
  data,
  color = "#5c8cff",
  height = 36,
  area = true,
  delay = 0,
  className,
}: SparklineProps) {
  const id = useId().replace(/:/g, "");
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  const width = 100;
  const pad = 3;

  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const points: [number, number][] = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * width,
    height - pad - ((v - min) / span) * (height - pad * 2),
  ]);

  const line = smoothPath(points);
  const fill = `${line} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div ref={ref} className={clsx("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        role="presentation"
      >
        <defs>
          <linearGradient id={`spark-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {area && (
          <path
            d={fill}
            fill={`url(#spark-fill-${id})`}
            style={{
              opacity: inView ? 1 : 0,
              transition: `opacity 700ms var(--ease-smooth) ${delay + 320}ms`,
            }}
          />
        )}

        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{
            // 400 comfortably exceeds the path length at this viewBox size.
            strokeDasharray: 400,
            strokeDashoffset: inView ? 0 : 400,
            transition: `stroke-dashoffset 1100ms var(--ease-smooth) ${delay}ms`,
          }}
        />

        {/* Head of the line */}
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2.2"
          fill={color}
          style={{
            opacity: inView ? 1 : 0,
            transition: `opacity 400ms ease ${delay + 900}ms`,
          }}
        />
      </svg>
    </div>
  );
}
