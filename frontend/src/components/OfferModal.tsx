"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, FileText, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { generateOffer } from "@/lib/api";

interface OfferModalProps {
  companyId: number;
  companyName?: string;
  onClose: () => void;
}

/**
 * Three bouncing dots that communicate "AI is generating".
 * Staggered animationDelay so each dot peaks at a different moment.
 */
function BouncingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="inline-block h-2 w-2 rounded-full bg-brand-400 animate-bounce-dot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export default function OfferModal({
  companyId,
  companyName,
  onClose,
}: OfferModalProps) {
  const [copied, setCopied] = useState(false);
  /* Track the element that opened the modal so focus can be restored. */
  const previousFocusRef = useRef<Element | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["offer", companyId],
    queryFn: () => generateOffer(companyId, "email", "professional"),
    refetchOnMount: "always",
    staleTime: 0,
  });

  /* ── Body scroll lock ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ── Focus management ── */
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    /* Focus the panel itself so Tab begins inside it. */
    panelRef.current?.focus();
    return () => {
      /* Restore focus to the triggering element on close. */
      (previousFocusRef.current as HTMLElement | null)?.focus();
    };
  }, []);

  /* ── Keyboard: Escape closes, Tab traps inside panel ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.closest("[aria-hidden]"));

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
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
    /* Backdrop: fades in, click-outside closes */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      {/* Animated backdrop */}
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm animate-fade-in"
        aria-hidden
      />

      {/* Panel: scales + fades in for a spring-like entrance */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        /* tabIndex so the panel itself can receive programmatic focus. */
        tabIndex={-1}
        className={clsx(
          "relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col",
          "overflow-hidden rounded-xl border border-white/10 bg-panel shadow-2xl",
          "ring-gradient",
          /* Spring entrance — communicates that the modal is appearing, not just visible */
          "animate-scale-in",
          "focus:outline-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="offer-modal-title"
                className="text-lg font-bold text-white"
              >
                Коммерческое предложение
              </h2>

              {/* LLM vs template badge — unchanged behaviour */}
              {data &&
                (data.used_llm ? (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                      "border border-brand-500/40 bg-brand-500/15",
                      "text-[11px] font-semibold text-brand-100",
                      "animate-scale-in"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI (LLM)
                  </span>
                ) : (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                      "border border-white/10 bg-white/5",
                      "text-[11px] font-semibold text-muted",
                      "animate-scale-in"
                    )}
                  >
                    <FileText className="h-3 w-3" />
                    Шаблон
                  </span>
                ))}
            </div>

            {companyName && (
              <p className="mt-0.5 text-xs text-muted">
                Компания:{" "}
                <span className="text-white/70">{companyName}</span>
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

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Generating state: bouncing dots communicate active work. */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted">
              <BouncingDots />
              <span className="text-sm animate-fade-in">
                Генерируем предложение…
              </span>
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
            <div className="space-y-4 animate-fade-in">
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

        {/* ── Footer ── */}
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
