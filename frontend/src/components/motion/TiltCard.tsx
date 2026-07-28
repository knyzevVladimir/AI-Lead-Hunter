"use client";

import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { clamp, prefersReducedMotion } from "@/lib/motion";

interface TiltCardProps {
  children: ReactNode;
  /** Max rotation in degrees on each axis. Default 7. */
  max?: number;
  /** Show the pointer-following specular highlight. Default true. */
  glare?: boolean;
  /** Lift toward the viewer on hover, in px. Default 6. */
  lift?: number;
  className?: string;
}

/**
 * Real 3D tilt driven by pointer position.
 *
 * Writes transforms straight to the DOM node inside a rAF instead of going
 * through React state — pointer moves fire far faster than React can usefully
 * re-render, and this keeps the whole interaction on the compositor.
 */
export default function TiltCard({
  children,
  max = 7,
  glare = true,
  lift = 6,
  className,
}: TiltCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    // No tilt for reduced-motion users or touch-primary devices.
    if (prefersReducedMotion()) return;
    if (window.matchMedia?.("(hover: none)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let px = 50;
    let py = 50;
    let active = false;

    const apply = () => {
      frameRef.current = null;
      inner.style.transform = active
        ? `rotateX(${targetY}deg) rotateY(${targetX}deg) translateZ(${lift}px)`
        : "rotateX(0deg) rotateY(0deg) translateZ(0)";

      if (glare && glareRef.current) {
        glareRef.current.style.opacity = active ? "1" : "0";
        glareRef.current.style.background = `radial-gradient(320px circle at ${px}% ${py}%, rgba(255,255,255,0.14), transparent 62%)`;
      }
    };

    const schedule = () => {
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(apply);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      px = nx * 100;
      py = ny * 100;
      // Invert Y so the card leans toward the cursor.
      targetX = clamp((nx - 0.5) * 2 * max, -max, max);
      targetY = clamp(-(ny - 0.5) * 2 * max, -max, max);
      active = true;
      schedule();
    };

    const onLeave = () => {
      active = false;
      schedule();
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [max, glare, lift]);

  return (
    <div ref={wrapRef} className={clsx("perspective", className)}>
      <div
        ref={innerRef}
        className="preserve-3d relative h-full transition-transform duration-300 ease-smooth"
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
}
