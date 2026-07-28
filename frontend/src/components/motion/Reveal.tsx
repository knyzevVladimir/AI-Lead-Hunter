"use client";

import type { ElementType, ReactNode } from "react";
import clsx from "clsx";
import { useInView } from "@/lib/motion";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, string> = {
  up: "translate3d(0, 18px, 0)",
  down: "translate3d(0, -18px, 0)",
  left: "translate3d(18px, 0, 0)",
  right: "translate3d(-18px, 0, 0)",
  none: "none",
};

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms. */
  delay?: number;
  /** Where the element travels in from. Default "up". */
  from?: Direction;
  /** Duration in ms. Default 600. */
  duration?: number;
  /** Add a slight blur-in for hero-level elements. */
  blur?: boolean;
  className?: string;
  as?: ElementType;
}

/**
 * Reveals its children when they scroll into view.
 *
 * Deliberately CSS-transition based rather than a JS animation library: the
 * browser keeps the whole thing on the compositor, and `prefers-reduced-motion`
 * is handled by the global CSS kill-switch (which collapses the duration to
 * ~0ms while still applying the final, visible state).
 */
export default function Reveal({
  children,
  delay = 0,
  from = "up",
  duration = 600,
  blur = false,
  className,
  as: Tag = "div",
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={clsx("motion-reveal", className)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : OFFSET[from],
        filter: blur && !inView ? "blur(8px)" : "blur(0px)",
        transition: [
          `opacity ${duration}ms var(--ease-smooth) ${delay}ms`,
          `transform ${duration}ms var(--ease-smooth) ${delay}ms`,
          `filter ${duration}ms var(--ease-smooth) ${delay}ms`,
        ].join(", "),
        willChange: inView ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
