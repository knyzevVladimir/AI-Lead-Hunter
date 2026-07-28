"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  Loader2,
  Mail,
  Info,
  ChevronDown,
  Send,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import { listMessages, type CampaignMessage } from "@/lib/api";
import Reveal from "@/components/motion/Reveal";
import AnimatedNumber from "@/components/motion/AnimatedNumber";

/* ------------------------------------------------------------------ */
/* Dictionaries                                                         */
/* ------------------------------------------------------------------ */

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  sms: "SMS",
};

const MSG_STATUS_LABEL: Record<string, string> = {
  draft: "Черновик",
  queued: "В очереди",
  sent: "Отправлено",
  delivered: "Доставлено",
  replied: "Ответ получен",
  failed: "Ошибка",
};

/* Tailwind classes for each message status pill */
const MSG_STATUS_TONE: Record<string, string> = {
  draft: "border-slate-500/40 bg-slate-500/15 text-slate-300",
  queued: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
  sent: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  delivered: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  replied:
    "border-green-500/50 bg-green-500/20 text-green-200 shadow-[0_0_10px_-3px_rgba(34,197,94,0.5)]",
  failed: "border-red-500/40 bg-red-500/15 text-red-300",
};

/* Tailwind classes for each channel pill */
const CHANNEL_TONE: Record<string, string> = {
  email: "border-brand-500/40 bg-brand-500/15 text-brand-300",
  whatsapp: "border-green-600/40 bg-green-600/15 text-green-300",
  telegram: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  sms: "border-amber-500/40 bg-amber-500/15 text-amber-300",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CampaignsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["campaigns", "messages"],
    queryFn: () => listMessages(),
  });

  const messages = data ?? [];

  // Compute summary chips from the fetched data — no extra API calls
  const byChan = countBy(messages, (m) => m.channel);
  const byStatus = countBy(messages, (m) => m.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal from="down" duration={500}>
        <div className="flex flex-col gap-1">
          <div className="eyebrow flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5" />
            Охват и коммуникация
          </div>
          <h1 className="page-title">Кампании</h1>
          <p className="page-subtitle">
            Сгенерированные письма и черновики охвата.
          </p>
        </div>
      </Reveal>

      {/* Summary row */}
      <Reveal delay={80} duration={500}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Total */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-panel/60 px-4 py-2.5 backdrop-blur-sm">
            <Mail className="h-4 w-4 text-brand-400" />
            <span className="text-xs text-muted">Всего</span>
            <span className="text-sm font-bold text-white tabular-nums">
              <AnimatedNumber
                value={isLoading ? 0 : messages.length}
                duration={800}
                delay={200}
              />
            </span>
          </div>

          {/* Per-status summary chips */}
          {!isLoading &&
            Object.entries(byStatus).map(([st, count]) => (
              <div
                key={st}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                  MSG_STATUS_TONE[st] ??
                    "border-white/10 bg-white/5 text-muted"
                )}
              >
                <span className="font-medium">
                  {MSG_STATUS_LABEL[st] ?? st}
                </span>
                <span className="font-bold tabular-nums">{count}</span>
              </div>
            ))}

          {/* Per-channel summary chips */}
          {!isLoading &&
            Object.entries(byChan).map(([ch, count]) => (
              <div
                key={ch}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                  CHANNEL_TONE[ch] ?? "border-white/10 bg-white/5 text-muted"
                )}
              >
                <span className="font-medium">{CHANNEL_LABEL[ch] ?? ch}</span>
                <span className="font-bold tabular-nums">{count}</span>
              </div>
            ))}
        </div>
      </Reveal>

      {/* Hint banner — restyled with ring-gradient */}
      <Reveal delay={140} duration={450}>
        <div className="ring-gradient relative flex items-start gap-3 rounded-xl border border-brand-500/25 bg-brand-500/8 px-4 py-3.5 text-sm text-brand-100 backdrop-blur-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
          <span>
            Черновики генерируются на странице{" "}
            <span className="font-semibold text-white">«Поиск и лиды»</span>{" "}
            кнопкой{" "}
            <span className="font-semibold text-white">«Предложение»</span>.
            Здесь собраны все созданные сообщения.
          </span>
        </div>
      </Reveal>

      {/* Messages table card */}
      <Reveal delay={200} duration={450}>
        <section className="card overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted" />
              <h2 className="text-sm font-semibold text-white">Сообщения</h2>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted tabular-nums">
                {isLoading ? (
                  <span className="animate-pulse">…</span>
                ) : (
                  messages.length
                )}
              </span>
            </div>
            {/* Background refetch spinner */}
            {!isLoading && (
              <Send className="h-3.5 w-3.5 text-muted/40" />
            )}
          </div>

          <MessagesTable
            items={messages}
            loading={isLoading}
            error={isError}
            errorMsg={(error as Error)?.message}
          />
        </section>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Messages table                                                      */
/* ------------------------------------------------------------------ */

function MessagesTable({
  items,
  loading,
  error,
  errorMsg,
}: {
  items: CampaignMessage[];
  loading: boolean;
  error: boolean;
  errorMsg?: string;
}) {
  if (loading) {
    return (
      <div className="divide-y divide-white/5">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonRow key={i} delay={i * 50} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
        <div className="rounded-full border border-red-500/20 bg-red-500/10 p-3">
          <Mail className="h-5 w-5 text-red-400" />
        </div>
        <p className="text-sm text-red-300">Не удалось загрузить сообщения.</p>
        {errorMsg && (
          <p className="text-xs text-red-300/60">{errorMsg}</p>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 py-20 text-center">
        <div className="rounded-full border border-white/10 bg-white/5 p-4">
          <Mail className="h-7 w-7 text-white/20" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted">
            Нет сгенерированных сообщений
          </p>
          <p className="mt-1 text-xs text-muted/60">
            Перейдите на страницу «Поиск и лиды» и нажмите «Предложение».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Sticky, blurred table header */}
        <thead className="sticky top-0 z-10 backdrop-blur-md">
          <tr className="border-b border-white/10 bg-panel/80">
            <th className="th">Компания</th>
            <th className="th">Канал</th>
            <th className="th">Тема</th>
            <th className="th">Статус</th>
            <th className="th text-center">Шаг</th>
            <th className="th">Создано</th>
            <th className="th w-8" />
          </tr>
        </thead>
        <tbody>
          {items.map((m, i) => (
            <MessageRow key={m.id} message={m} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expandable message row                                              */
/* ------------------------------------------------------------------ */

function MessageRow({
  message: m,
  index,
}: {
  message: CampaignMessage;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  const statusTone =
    MSG_STATUS_TONE[m.status] ?? "border-white/10 bg-white/5 text-muted";
  const channelTone =
    CHANNEL_TONE[m.channel] ?? "border-white/10 bg-white/5 text-muted";

  return (
    <>
      {/* Main row */}
      <Reveal
        as="tr"
        from="up"
        delay={index * 40}
        duration={350}
        className={clsx(
          "row-hover relative cursor-pointer border-b border-white/5 last:border-0",
          open && "bg-white/[0.03]"
        )}
        // @ts-expect-error — Reveal's `as` prop renders the correct element
        onClick={() => setOpen((v) => !v)}
      >
        {/* Company ID */}
        <td className="td font-mono text-xs text-muted">
          #{m.company_id}
        </td>

        {/* Channel pill */}
        <td className="td">
          <span
            className={clsx(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              channelTone
            )}
          >
            {CHANNEL_LABEL[m.channel] ?? m.channel}
          </span>
        </td>

        {/* Subject */}
        <td className="td max-w-[200px] truncate font-medium text-white">
          {m.subject || <span className="text-muted">—</span>}
        </td>

        {/* Status pill */}
        <td className="td">
          <span
            className={clsx(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              "transition-all duration-300",
              statusTone
            )}
          >
            {MSG_STATUS_LABEL[m.status] ?? m.status}
          </span>
        </td>

        {/* Follow-up step */}
        <td className="td text-center font-mono tabular-nums text-muted">
          {m.followup_step}
        </td>

        {/* Date */}
        <td className="td whitespace-nowrap text-xs text-muted">
          {formatDate(m.created_at)}
        </td>

        {/* Expand chevron */}
        <td className="td pr-4 text-right">
          <ChevronDown
            className={clsx(
              "ml-auto h-4 w-4 text-muted transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </td>
      </Reveal>

      {/* Expandable body — pure height/opacity transition, no layout shift */}
      <tr className={clsx("border-b border-white/5 last:border-0", !open && "hidden")}>
        <td colSpan={7} className="px-5 pb-4 pt-0">
          {/* Smooth reveal of the full message body */}
          <div
            className={clsx(
              "overflow-hidden rounded-lg border border-white/10 bg-ink/60 transition-all duration-300",
              open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-4 py-3">
              <p className="eyebrow mb-2">Текст сообщения</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {m.body}
              </p>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton row                                                        */
/* ------------------------------------------------------------------ */

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="flex items-center gap-4 border-b border-white/5 px-4 py-3.5"
      style={{
        opacity: 0,
        animation: `fade-up 0.4s var(--ease-smooth) ${delay}ms both`,
      }}
    >
      <div className="skeleton h-3.5 w-10 rounded" />
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-3.5 w-36 rounded" />
      <div className="skeleton h-5 w-24 rounded-full" />
      <div className="skeleton h-3.5 w-6 rounded" />
      <div className="skeleton h-3.5 w-28 rounded" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Utility                                                             */
/* ------------------------------------------------------------------ */

/** Count occurrences of values returned by `key` across `items`. */
function countBy<T>(
  items: T[],
  key: (item: T) => string
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    result[k] = (result[k] ?? 0) + 1;
  }
  return result;
}
