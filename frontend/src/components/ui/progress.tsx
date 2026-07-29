import { cn } from "@/utils/cn";

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-slate-100", className)} role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full bg-violet-600 transition-[width] duration-500", indicatorClassName)} style={{ width: `${safe}%` }} />
    </div>
  );
}
