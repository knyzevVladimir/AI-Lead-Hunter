import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export function Checkbox({ checked, onCheckedChange, label, className }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string; className?: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={() => onCheckedChange(!checked)} className={cn("flex h-4 w-4 items-center justify-center rounded border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1", checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent hover:border-slate-400", className)}>
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  );
}
