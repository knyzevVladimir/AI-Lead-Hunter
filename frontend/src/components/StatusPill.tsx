import clsx from "clsx";
import type { CRMStatus } from "@/lib/types";

interface StatusMeta {
  label: string;
  tone: string;
}

export const STATUS_META: Record<CRMStatus, StatusMeta> = {
  new: {
    label: "Новый",
    tone: "border-slate-500/40 bg-slate-500/15 text-slate-300",
  },
  analyzed: {
    label: "Проанализирован",
    tone: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  },
  email_sent: {
    label: "Письмо отправлено",
    tone: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
  },
  replied: {
    label: "Ответил",
    tone: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  },
  negotiation: {
    label: "Переговоры",
    tone: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  client: {
    label: "Клиент",
    tone: "border-green-500/40 bg-green-500/15 text-green-300",
  },
  rejected: {
    label: "Отказ",
    tone: "border-red-500/40 bg-red-500/15 text-red-300",
  },
  blacklist: {
    label: "Чёрный список",
    tone: "border-zinc-500/40 bg-zinc-500/15 text-zinc-400",
  },
};

/** Human-readable Russian label for a CRM status. */
export function statusLabel(status: CRMStatus): string {
  return STATUS_META[status]?.label ?? status;
}

/** Ordered list of statuses for selects / columns fallback. */
export const STATUS_ORDER: CRMStatus[] = [
  "new",
  "analyzed",
  "email_sent",
  "replied",
  "negotiation",
  "client",
  "rejected",
  "blacklist",
];

interface StatusPillProps {
  status: CRMStatus;
  className?: string;
}

export default function StatusPill({ status, className }: StatusPillProps) {
  const meta = STATUS_META[status] ?? {
    label: status,
    tone: "border-white/10 bg-white/5 text-muted",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
