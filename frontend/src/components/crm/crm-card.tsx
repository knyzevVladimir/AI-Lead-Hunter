"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ui/score-ring";
import type { Company } from "@/types/domain";
import { cn } from "@/utils/cn";

export function CrmCard({ company, onOpen, overlay = false }: { company: Company; onOpen?: () => void; overlay?: boolean }) {
  const sortable = useSortable({ id: String(company.id), data: { company, status: company.status }, disabled: overlay });
  const style = overlay ? undefined : { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };
  return (
    <article ref={sortable.setNodeRef} style={style} className={cn("group rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,.03)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,.06)]", sortable.isDragging && "opacity-30", overlay && "w-[286px] rotate-2 shadow-2xl")}>
      <div className="flex items-start gap-2.5"><button type="button" {...sortable.attributes} {...sortable.listeners} className="mt-1 cursor-grab rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing group-hover:opacity-100" aria-label="Перетащить карточку"><GripVertical className="h-3.5 w-3.5" /></button><Avatar name={company.name} size="md" /><button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left"><h3 className="truncate text-xs font-semibold text-slate-900 hover:text-violet-700">{company.name}</h3><p className="mt-1 truncate text-[10px] text-slate-400">{company.category || "Без категории"}</p></button><ScoreRing score={company.ai_score} size="sm" /></div>
      {company.city && <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400"><MapPin className="h-3 w-3" />{company.city}</p>}
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-slate-300">{company.phone && <Phone className="h-3.5 w-3.5 text-slate-400" />}{company.email && <Mail className="h-3.5 w-3.5 text-emerald-500" />}{company.website && <ExternalLink className="h-3.5 w-3.5 text-blue-500" />}<button type="button" onClick={onOpen} className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MessageSquareText className="h-3 w-3" />Детали</button></div>
    </article>
  );
}
