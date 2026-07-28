"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Replays an enter animation on every route change.
 *
 * Keying on the pathname makes React discard and remount the subtree, which
 * restarts the CSS animation — no animation library and no exit-transition
 * bookkeeping required.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-slide-up-blur">
      {children}
    </div>
  );
}
