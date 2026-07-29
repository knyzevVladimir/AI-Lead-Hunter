"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Inbox } from "lucide-react";
import { CrmCard } from "@/components/crm/crm-card";
import { STATUS_META } from "@/theme/constants";
import type { Company, CRMStatus } from "@/types/domain";
import { cn } from "@/utils/cn";

export function CrmColumn({ status, companies, onOpen }: { status: CRMStatus; companies: Company[]; onOpen: (company: Company) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });
  const meta = STATUS_META[status];
  return (
    <section ref={setNodeRef} className={cn("flex h-full w-[310px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-100/70 transition sm:w-[326px]", isOver && "border-violet-300 bg-violet-50/70 ring-2 ring-violet-100")}>
      <div className="flex items-center gap-2 border-b border-slate-200/80 px-3.5 py-3"><span className="h-2 w-2 rounded-full" style={{ background: meta.dot }} /><h2 className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{meta.label}</h2><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500 ring-1 ring-slate-200">{companies.length}</span></div>
      <SortableContext items={companies.map((company) => String(company.id))} strategy={verticalListSortingStrategy}>
        <div className="min-h-[120px] flex-1 space-y-2.5 overflow-y-auto p-2.5">{companies.length ? companies.map((company) => <CrmCard key={company.id} company={company} onOpen={() => onOpen(company)} />) : <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 text-center"><Inbox className="h-5 w-5 text-slate-300" /><p className="mt-2 text-[10px] font-medium text-slate-400">Перетащите лид сюда</p></div>}</div>
      </SortableContext>
    </section>
  );
}
