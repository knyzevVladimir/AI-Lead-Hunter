import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

export function SectionCard({ title, description, action, children, className, contentClassName }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string; contentClassName?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-sm font-semibold text-slate-900">{title}</h2>{description && <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{description}</p>}</div>
        {action}
      </div>
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </Card>
  );
}
