"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface TabItem<T extends string> { value: T; label: string; count?: number }

export function Tabs<T extends string>({ items, value, onChange, className }: { items: TabItem<T>[]; value: T; onChange: (value: T) => void; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1", className)} role="tablist">
      {items.map((item) => (
        <button key={item.value} type="button" role="tab" aria-selected={item.value === value} onClick={() => onChange(item.value)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition", item.value === value ? "bg-white text-slate-950 shadow-[0_1px_3px_rgba(15,23,42,.08)]" : "text-slate-500 hover:text-slate-800")}>
          {item.label}
          {item.count !== undefined && <span className={cn("tabular-nums", item.value === value ? "text-slate-500" : "text-slate-400")}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
