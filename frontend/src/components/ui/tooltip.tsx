import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Tooltip({ content, children, side = "top", className }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom"; className?: string }) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span role="tooltip" className={cn("pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block", side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]")}>
        {content}
      </span>
    </span>
  );
}
