"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Loader2, Sparkles, X, FileText } from "lucide-react";
import { generateOffer } from "@/lib/api";

interface OfferModalProps {
  companyId: number;
  companyName?: string;
  onClose: () => void;
}

export default function OfferModal({
  companyId,
  companyName,
  onClose,
}: OfferModalProps) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["offer", companyId],
    queryFn: () => generateOffer(companyId, "email", "professional"),
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Close on Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCopy = async () => {
    if (!data) return;
    const text = [data.subject, "", data.body].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable in some contexts */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Коммерческое предложение
              </h2>
              {data &&
                (data.used_llm ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/40 bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-100">
                    <Sparkles className="h-3 w-3" />
                    AI (LLM)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-muted">
                    <FileText className="h-3 w-3" />
                    Шаблон
                  </span>
                ))}
            </div>
            {companyName && (
              <p className="mt-0.5 text-xs text-muted">
                Компания: {companyName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              <span className="text-sm">Генерируем предложение…</span>
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Не удалось сгенерировать предложение.
              <div className="mt-1 text-xs text-red-300/70">
                {(error as Error)?.message}
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {data.subject && (
                <div>
                  <div className="label">Тема</div>
                  <div className="rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-sm font-medium text-white">
                    {data.subject}
                  </div>
                </div>
              )}
              <div>
                <div className="label">Текст ({data.channel})</div>
                <div className="whitespace-pre-wrap rounded-lg border border-white/10 bg-ink px-4 py-3 text-sm leading-relaxed text-white/90">
                  {data.body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button onClick={onClose} className="btn-ghost">
            Закрыть
          </button>
          <button
            onClick={handleCopy}
            disabled={!data}
            className="btn-primary"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Скопировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
