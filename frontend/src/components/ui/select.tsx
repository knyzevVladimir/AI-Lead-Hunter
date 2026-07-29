import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn("h-10 w-full appearance-none rounded-[11px] border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);
Select.displayName = "Select";
