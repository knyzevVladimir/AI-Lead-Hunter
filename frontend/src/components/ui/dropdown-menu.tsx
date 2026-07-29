"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/utils/cn";

export function DropdownMenu({ trigger, children, align = "end", className }: { trigger: React.ReactElement; children: ReactNode; align?: "start" | "end"; className?: string }) {
  return <Popover trigger={trigger} align={align} className={cn("min-w-52 p-1.5", className)}>{children}</Popover>;
}

export function DropdownItem({ icon: Icon, children, onClick, tone = "default", disabled }: { icon?: LucideIcon; children: ReactNode; onClick?: () => void; tone?: "default" | "danger"; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition disabled:opacity-40", tone === "danger" ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950")}>
      {Icon && <Icon className="h-4 w-4 text-current opacity-70" />}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-slate-100" />;
}
