import type { ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/cn";

export function FilterButton({ icon, label, value, active, onClear }: { icon?: ReactNode; label: string; value?: string; active?: boolean; onClear?: () => void }) {
  return <span className={cn("inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-xs font-medium transition", active ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{icon}<span>{label}</span>{value && <span className="max-w-28 truncate text-current opacity-70">· {value}</span>}{active && onClear ? <button type="button" aria-label={`Сбросить ${label}`} onClick={(event) => { event.stopPropagation(); onClear(); }} className="-mr-1 rounded p-0.5 hover:bg-violet-100"><X className="h-3 w-3" /></button> : <ChevronDown className="h-3 w-3 opacity-50" />}</span>;
}
