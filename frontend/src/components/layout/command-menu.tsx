"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, Search, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ui/score-ring";
import { useShell } from "@/providers/shell-provider";
import { api } from "@/services/api";
import { NAVIGATION } from "@/theme/navigation";
import { cn } from "@/utils/cn";

export function CommandMenu() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { commandOpen, setCommandOpen } = useShell();
  const [query, setQuery] = useState("");
  const leadsQuery = useQuery({ queryKey: ["command", "leads"], queryFn: () => api.listLeads({ limit: 300, sort_by_score: true }), enabled: commandOpen, staleTime: 60_000 });

  useEffect(() => {
    if (!commandOpen) return;
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
    const close = (event: KeyboardEvent) => event.key === "Escape" && setCommandOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [commandOpen, setCommandOpen]);

  const normalized = query.trim().toLocaleLowerCase("ru");
  const pages = useMemo(() => NAVIGATION.filter((item) => !normalized || item.label.toLocaleLowerCase("ru").includes(normalized)).slice(0, 5), [normalized]);
  const leads = useMemo(() => (leadsQuery.data?.items ?? []).filter((lead) => !normalized || [lead.name, lead.category, lead.city, lead.address].some((value) => value?.toLocaleLowerCase("ru").includes(normalized))).slice(0, 7), [leadsQuery.data, normalized]);
  const navigate = (href: string) => { setCommandOpen(false); router.push(href); };

  return (
    <AnimatePresence>
      {commandOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button type="button" aria-label="Закрыть поиск" className="absolute inset-0 bg-slate-950/25 backdrop-blur-[3px]" onClick={() => setCommandOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div role="dialog" aria-modal="true" aria-label="Глобальный поиск" className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_28px_90px_rgba(15,23,42,.24)]" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.16 }}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4">
              <Search className="h-5 w-5 text-slate-400" />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Страница, команда или компания…" className="h-14 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" />
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400">ESC</kbd>
            </div>
            <div className="max-h-[min(520px,65vh)] overflow-y-auto p-2">
              {pages.length > 0 && <SectionTitle>Навигация</SectionTitle>}
              {pages.map((item) => <CommandRow key={item.href} icon={item.icon} title={item.label} meta={item.shortcut ? `G затем ${item.shortcut}` : undefined} onClick={() => navigate(item.href)} />)}
              {leads.length > 0 && <SectionTitle className="mt-3">Лиды</SectionTitle>}
              {leads.map((lead) => (
                <button key={lead.id} type="button" onClick={() => navigate(`/leads/${lead.id}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100">
                  <Avatar name={lead.name} size="md" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{lead.name}</span><span className="block truncate text-xs text-slate-400">{[lead.category, lead.city].filter(Boolean).join(" · ") || "Без категории"}</span></span>
                  <ScoreRing score={lead.ai_score} size="sm" />
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
              {!leadsQuery.isLoading && pages.length === 0 && leads.length === 0 && <div className="flex flex-col items-center px-6 py-12 text-center"><Sparkles className="mb-3 h-6 w-6 text-slate-300" /><p className="text-sm font-medium text-slate-700">Ничего не найдено</p><p className="mt-1 text-xs text-slate-400">Попробуйте другое название или перейдите к поиску бизнеса.</p></div>}
              {leadsQuery.isError && <div className="px-3 py-3 text-xs text-rose-600">Лиды недоступны, но навигация продолжает работать.</div>}
            </div>
            <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[10px] text-slate-400"><span>↑↓ выбрать</span><span>↵ открыть</span><span className="ml-auto inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{leadsQuery.data?.total ?? 0} лидов</span></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400", className)}>{children}</p>;
}

function CommandRow({ icon: Icon, title, meta, onClick }: { icon: React.ElementType; title: string; meta?: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"><Icon className="h-4 w-4" /></span><span className="flex-1 text-sm font-medium text-slate-700">{title}</span>{meta && <span className="text-[10px] text-slate-400">{meta}</span>}<ArrowRight className="h-4 w-4 text-slate-300" /></button>;
}
