"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Info } from "lucide-react";
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
      <div className="flex items-start gap-3 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
        <span>
          Черновики генерируются на странице{" "}
          <span className="font-medium text-white">«Поиск и лиды»</span> кнопкой{" "}
          <span className="font-medium text-white">«Предложение»</span>. Здесь
          собраны все созданные сообщения.
        </span>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">
            Сообщения{" "}
            <span className="ml-1 text-muted">
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
      <div className="px-5 py-10 text-center text-sm text-red-300">
        Не удалось загрузить сообщения.
        {errorMsg && (
          <div className="mt-1 text-xs text-red-300/70">{errorMsg}</div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center text-sm text-muted">
        <Mail className="h-8 w-8 text-white/20" />
        Пока нет сгенерированных сообщений.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
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
              className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <td className="td text-muted">#{m.company_id}</td>
              <td className="td">
                <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                  {CHANNEL_LABEL[m.channel] ?? m.channel}
                </span>
              </td>
              <td className="td max-w-[220px] truncate font-medium text-white">
                {m.subject || <span className="text-muted">—</span>}
              </td>
              <td className="td max-w-[320px]">
                <span className="line-clamp-2 text-xs text-muted">
                  {m.body}
                </span>
              </td>
              <td className="td">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/80">
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
