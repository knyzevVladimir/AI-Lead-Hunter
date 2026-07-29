import { ScanSearch } from "lucide-react";
import { cn } from "@/utils/cn";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-[0_4px_12px_rgba(15,23,42,.16)]"><ScanSearch className="h-[18px] w-[18px]" /></span>
      {!compact && <span className="min-w-0"><span className="block truncate text-sm font-semibold tracking-[-0.02em] text-slate-950">AI Lead Hunter</span><span className="block truncate text-[10px] font-medium uppercase tracking-[.11em] text-slate-400">Revenue intelligence</span></span>}
    </div>
  );
}
