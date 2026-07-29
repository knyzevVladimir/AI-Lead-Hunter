"use client";

import { useEffect, useRef } from "react";

export function useInfiniteObserver(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onIntersect(), { rootMargin: "240px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, onIntersect]);
  return ref;
}
