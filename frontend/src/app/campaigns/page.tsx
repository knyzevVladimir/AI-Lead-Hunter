"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, Info, Inbox } from "lucide-react";
import { listMessages, type CampaignMessage } from "@/lib/api";

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

const MSG_STATUS_TONE: Record<string, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  sent: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-cyan-200 bg-cyan-50 text-cyan-700",
  replied: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
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

export default function CampaignsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["campaigns", "messages"],
    queryFn: () => listMessages(),
  });

  const messages = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Кампании</h1>
        <p className="page-subtitle">
          Сгенерированные письма и черновики охвата.
        </p>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span>
          Черновики генерируются на странице{" "}
          <span className="font-semibold">«Поиск и лиды»</span> кнопкой{" "}
          <span className="font-semibold">«Предложение»</span>. Здесь собраны
          все созданные сообщения.
        </span>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            Сообщения{" "}
            <span className="ml-1 font-normal text-muted">
              {isLoading ? "…" : `(${messages.length})`}
            </span>
          </h2>
        </div>

        <MessagesTable
          items={messages}
          loading={isLoading}
          error={isError}
          errorMsg={(error as Error)?.message}
        />
      </section>
    </div>
  );
}

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
      <div className="space-y-2 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-11 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm text-rose-600">
        Не удалось загрузить сообщения.
        {errorMsg && (
          <div className="mt-1 text-xs text-rose-500">{errorMsg}</div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <Inbox className="h-6 w-6 text-faint" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Пока пусто</p>
          <p className="mt-0.5 text-xs text-muted">
            Сгенерируйте первое предложение на странице «Поиск и лиды».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-slate-50/60">
            <th className="th">Компания</th>
            <th className="th">Канал</th>
            <th className="th">Тема</th>
            <th className="th">Превью</th>
            <th className="th">Статус</th>
            <th className="th">Шаг</th>
            <th className="th">Создано</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr
              key={m.id}
              className="border-b border-line transition-colors last:border-0 hover:bg-slate-50/70"
            >
              <td className="td text-muted">#{m.company_id}</td>
              <td className="td">
                <span className="inline-flex items-center rounded-md border border-line bg-slate-50 px-2 py-0.5 text-xs text-ink">
                  {CHANNEL_LABEL[m.channel] ?? m.channel}
                </span>
              </td>
              <td className="td max-w-[220px] truncate font-medium text-ink">
                {m.subject || <span className="text-faint">—</span>}
              </td>
              <td className="td max-w-[320px]">
                <span className="line-clamp-2 text-xs text-muted">
                  {m.body}
                </span>
              </td>
              <td className="td">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    MSG_STATUS_TONE[m.status] ??
                    "border-line bg-slate-50 text-muted"
                  }`}
                >
                  {MSG_STATUS_LABEL[m.status] ?? m.status}
                </span>
              </td>
              <td className="td text-center tabular-nums text-muted">
                {m.followup_step}
              </td>
              <td className="td whitespace-nowrap text-xs text-muted">
                {formatDate(m.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
