"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { Send, Bot, User, Sparkles, Zap } from "lucide-react";
import { chat } from "@/lib/api";
import type { Company } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreRing from "@/components/charts/ScoreRing";
import Reveal from "@/components/motion/Reveal";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  filters?: Record<string, unknown>;
  results?: Company[];
  total?: number;
}

const EXAMPLES = [
  "Найди барбершопы без сайта",
  "Покажи компании с рейтингом ниже 4",
  "Отсортируй по вероятности покупки сайта",
  "Только компании с Email",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

/* ------------------------------------------------------------------ */
/* Typing indicator — three bouncing dots in an assistant bubble        */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar with breathing glow while waiting */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/40">
        <Bot className="h-4 w-4 text-brand-500" />
        {/* Pulsing ambient ring communicates "thinking" */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-lg bg-brand-500/30 animate-glow-breathe"
        />
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/10 bg-ink px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce-dot"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty-state hero                                                     */
/* ------------------------------------------------------------------ */
function EmptyState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      {/* Icon tile with pulse rings — signals "live" system */}
      <Reveal from="none" blur>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 ring-1 ring-brand-500/40">
          <Sparkles className="h-7 w-7 text-brand-400" />
          {/* Two concentric pulse rings with staggered timing */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-brand-500/30 animate-pulse-ring"
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-pulse-ring"
            style={{ animationDelay: "0.8s" }}
          />
        </div>
      </Reveal>

      <Reveal delay={80} blur>
        <div>
          <p className="text-base font-semibold text-white">
            Спросите что-нибудь про ваших лидов
          </p>
          <p className="mt-1 text-sm text-muted">
            Формулируйте запросы свободно — ассистент разберёт фильтры
            автоматически.
          </p>
        </div>
      </Reveal>

      {/* Staggered chip grid */}
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex, i) => (
          <Reveal key={ex} delay={140 + i * 60} from="up">
            <button
              onClick={() => onSend(ex)}
              className="chip-off flex items-center gap-1.5"
            >
              <Zap className="h-3 w-3 text-brand-400" />
              {ex}
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single message bubble                                                */
/* ------------------------------------------------------------------ */
function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === "user";
  const filterEntries = message.filters
    ? Object.entries(message.filters).filter(
        ([, v]) => v !== null && v !== undefined && v !== false && v !== ""
      )
    : [];

  return (
    <div
      className={clsx(
        "flex gap-3 animate-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      // Slight stagger so rapid messages cascade rather than pop simultaneously
      style={{ animationDelay: `${Math.min(index * 40, 160)}ms` }}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-white/5 text-muted"
            : "bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/40"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={clsx(
          "max-w-[80%] space-y-3",
          isUser ? "items-end text-right" : "items-start"
        )}
      >
        {/* Main text bubble */}
        <div
          className={clsx(
            "inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-brand-500 text-white"
              : "rounded-tl-sm border border-white/10 bg-ink text-white/90"
          )}
        >
          {message.text}
        </div>

        {/* Parsed filter chips — reveal with a slight stagger after the bubble */}
        {!isUser && filterEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filterEntries.map(([k, v], fi) => (
              <span
                key={k}
                className="inline-flex animate-fade-in items-center gap-1 rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-100"
                style={{ animationDelay: `${fi * 50}ms` }}
              >
                <span className="opacity-70">{k}:</span>
                <span className="font-medium">{String(v)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Results table — staggered rows */}
        {!isUser && message.results && message.results.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="border-b border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-muted">
              Результаты:{" "}
              <span className="text-white">
                {message.total ?? message.results.length}
              </span>
            </div>
            <table className="w-full border-collapse text-left">
              <tbody>
                {message.results.slice(0, 12).map((c, ri) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 last:border-0 row-hover animate-fade-up"
                    style={{ animationDelay: `${ri * 35}ms` }}
                  >
                    <td className="px-3 py-2 text-sm font-medium text-white">
                      {c.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {c.city ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {/* ScoreRing at small size gives a richer reading than the badge */}
                      <ScoreRing score={c.ai_score} size={32} stroke={3} delay={ri * 40} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Hint when list is truncated */}
            {(message.total ?? 0) > 12 && (
              <div className="px-3 py-1.5 text-center text-[11px] text-muted">
                + ещё {(message.total ?? message.results.length) - 12} компаний
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (message: string) => chat(message),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: data.reply,
          filters: data.parsed_filters,
          results: data.results,
          total: data.total,
        },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: `Ошибка: ${(err as Error)?.message ?? "не удалось получить ответ."}`,
        },
      ]);
    },
  });

  // Scroll to bottom when messages arrive or typing indicator appears
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, mutation.isPending]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || mutation.isPending) return;
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
    setInput("");
    mutation.mutate(text);
    // Return focus to input so keyboard users can keep typing
    inputRef.current?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const charLimit = 500;
  const nearLimit = input.length > charLimit * 0.8;

  return (
    // Height accounts for the 4rem top bar; py-6/sm:py-8 in the layout wrapper
    // means we subtract the padding so the card fills the available space.
    <div className="flex h-[calc(100vh-4rem-3rem)] flex-col sm:h-[calc(100vh-4rem-4rem)]">
      {/* Page header */}
      <Reveal from="up" blur className="mb-4 shrink-0">
        <div>
          <h1 className="page-title">AI-чат</h1>
          <p className="page-subtitle">
            Формулируйте запросы на естественном языке — ассистент подберёт
            лидов и применит фильтры.
          </p>
        </div>
      </Reveal>

      {/* Messages area — fills remaining height */}
      <div
        ref={scrollRef}
        className="card flex-1 space-y-4 overflow-y-auto p-5"
      >
        {messages.length === 0 ? (
          <EmptyState onSend={send} />
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={m.id} message={m} index={i} />
          ))
        )}

        {/* Typing indicator appears while the mutation is in-flight */}
        {mutation.isPending && <TypingIndicator />}
      </div>

      {/* Quick-prompt chips — only when there is an active conversation */}
      {messages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 shrink-0">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => send(ex)}
              disabled={mutation.isPending}
              className="chip-off"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Composer — focus-within glow via Tailwind group pattern */}
      <form
        onSubmit={onSubmit}
        className="mt-3 shrink-0"
        aria-label="Отправить сообщение"
      >
        <div
          className={clsx(
            "flex items-center gap-3 rounded-xl border bg-ink/80 px-3 py-2",
            "transition-all duration-200",
            // Focus-within border + ring communicates active composer
            "border-white/10 focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20"
          )}
        >
          <input
            ref={inputRef}
            // Use a plain <input> without the .input class here because the
            // enclosing div already handles borders and focus styles.
            className="flex-1 bg-transparent text-sm text-white placeholder:text-muted/70 focus:outline-none"
            placeholder="Напишите запрос…"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, charLimit))}
            disabled={mutation.isPending}
            aria-label="Текст запроса"
            maxLength={charLimit}
          />

          {/* Character counter — only visible when nearing the limit */}
          {nearLimit && (
            <span
              className={clsx(
                "shrink-0 text-[11px] tabular-nums transition-colors",
                input.length >= charLimit ? "text-red-400" : "text-muted"
              )}
            >
              {input.length}/{charLimit}
            </span>
          )}

          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={mutation.isPending || !input.trim()}
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </div>
      </form>
    </div>
  );
}
