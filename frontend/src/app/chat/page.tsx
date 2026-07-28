"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { chat } from "@/lib/api";
import type { Company } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4">
        <h1 className="page-title">AI-чат</h1>
        <p className="page-subtitle">
          Формулируйте запросы на естественном языке — ассистент подберёт
          лидов и применит фильтры.
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="card flex-1 space-y-4 overflow-y-auto p-5"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                Спросите что-нибудь про ваших лидов
              </p>
              <p className="mt-1 text-xs text-muted">
                Например, воспользуйтесь одной из подсказок ниже.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="chip-off"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {mutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Bot className="h-4 w-4 text-brand-500" />
            <Loader2 className="h-4 w-4 animate-spin" />
            Думаю…
          </div>
        )}
      </div>

      {/* Quick prompts (persistent when there is a conversation) */}
      {messages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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

      {/* Input */}
      <form onSubmit={onSubmit} className="mt-3 flex items-center gap-3">
        <input
          className="input flex-1"
          placeholder="Напишите запрос…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={mutation.isPending || !input.trim()}
        >
          <Send className="h-4 w-4" />
          Отправить
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const filterEntries = message.filters
    ? Object.entries(message.filters).filter(
        ([, v]) => v !== null && v !== undefined && v !== false && v !== ""
      )
    : [];

  return (
    <div
      className={clsx(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-slate-100 text-muted"
            : "bg-brand-50 text-brand-500 ring-1 ring-brand-100"
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
        <div
          className={clsx(
            "inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-brand-500 text-white"
              : "rounded-tl-sm border border-line bg-white text-ink"
          )}
        >
          {message.text}
        </div>

        {/* Parsed filters */}
        {!isUser && filterEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filterEntries.map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700"
              >
                <span className="opacity-60">{k}:</span>
                <span className="font-medium">{String(v)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Results table */}
        {!isUser && message.results && message.results.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="border-b border-line bg-slate-50/60 px-3 py-1.5 text-[11px] font-medium text-muted">
              Результаты: {message.total ?? message.results.length}
            </div>
            <table className="w-full border-collapse text-left">
              <tbody>
                {message.results.slice(0, 12).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-3 py-2 text-sm font-medium text-ink">
                      {c.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {c.city ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <ScoreBadge score={c.ai_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
