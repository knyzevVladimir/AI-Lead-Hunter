"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

type ToastTone = "success" | "error" | "info";
interface ToastInput { title: string; description?: string; tone?: ToastTone; action?: { label: string; onClick: () => void } }
interface ToastItem extends ToastInput { id: string }
interface ToastContextValue { toast: (input: ToastInput) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const remove = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((input: ToastInput) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { ...input, id }].slice(-4));
    window.setTimeout(() => remove(id), input.tone === "error" ? 6000 : 3800);
  }, [remove]);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {items.map((item) => <ToastView key={item.id} item={item} onClose={() => remove(item.id)} />)}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? AlertCircle : Info;
  return (
    <motion.div initial={{ opacity: 0, x: 20, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 16, scale: 0.98 }} className="pointer-events-auto flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_16px_50px_rgba(15,23,42,.16)]">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", item.tone === "success" ? "text-emerald-600" : item.tone === "error" ? "text-rose-600" : "text-violet-600")} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>}
        {item.action && <button type="button" onClick={() => { item.action?.onClick(); onClose(); }} className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-700">{item.action.label}</button>}
      </div>
      <button type="button" onClick={onClose} className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть уведомление"><X className="h-3.5 w-3.5" /></button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
