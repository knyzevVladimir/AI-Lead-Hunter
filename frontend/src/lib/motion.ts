"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Easing                                                              */
/* ------------------------------------------------------------------ */

/** Fast start, long settle — the curve used by the counters and charts. */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Gentler ease for looping/ambient motion. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Frame-rate independent exponential smoothing. */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number
): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/* ------------------------------------------------------------------ */
/* Reduced motion                                                      */
/* ------------------------------------------------------------------ */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Synchronous read — safe to call in effects and rAF loops. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_QUERY).matches;
}

/**
 * Reactive version for render logic. Starts `false` on the server and on the
 * first client render so markup matches, then corrects after mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(REDUCED_QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

/* ------------------------------------------------------------------ */
/* Viewport observation                                                */
/* ------------------------------------------------------------------ */

interface InViewOptions {
  /** Fire once and stop observing. Default true. */
  once?: boolean;
  /** Fraction of the element that must be visible. Default 0.12. */
  threshold?: number;
  /** Margin around the root, e.g. "0px 0px -80px 0px". */
  rootMargin?: string;
}

/**
 * Tracks whether an element is in the viewport.
 *
 * Two behaviours worth knowing about:
 *
 * 1. An element taller than the viewport can never reach a meaningful
 *    intersection *ratio* — a 4000px table showing 700px of itself is only 17%
 *    visible, and a stricter threshold would leave it hidden forever. So for
 *    anything approaching viewport height we fall back to "any pixel visible".
 * 2. It degrades open: with no IntersectionObserver the element is reported
 *    visible immediately, so content is never trapped behind a failed observer.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: InViewOptions = {}
): [React.RefObject<T>, boolean] {
  const { once = true, threshold = 0.12, rootMargin = "0px 0px -60px 0px" } =
    options;

  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootHeight =
          entry.rootBounds?.height ?? window.innerHeight ?? 0;
        const isTall =
          rootHeight > 0 && entry.boundingClientRect.height > rootHeight * 0.8;

        const visible =
          entry.isIntersecting &&
          (isTall || entry.intersectionRatio >= threshold);

        if (visible) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      // Observe the 0 crossing too, so tall elements still get a callback.
      { threshold: [0, threshold], rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, inView];
}

/**
 * Pointer position relative to an element, normalised to -1..1 on both axes.
 * Returns `null` while the pointer is outside. Used for tilt + globe parallax.
 */
export function useRelativePointer<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) return;
    // Skip on touch-primary devices: hover tilt is meaningless there.
    if (window.matchMedia?.("(hover: none)").matches) return;

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setPos({
        x: clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
        y: clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
      });
    };
    const onLeave = () => setPos(null);

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return { ref, pos };
}
