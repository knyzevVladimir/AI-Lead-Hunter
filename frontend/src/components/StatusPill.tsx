import clsx from "clsx";
import type { CRMStatus } from "@/lib/types";

interface StatusMeta {
  label: string;
  tone: string;
}

export const STATUS_META: Record<CRMStatus, StatusMeta> = {
  new: {
    label: "Новый",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
  },
  analyzed: {
    label: "Проанализирован",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  email_sent: {
    label: "Письмо отправлено",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  replied: {
    label: "Ответил",
    tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  negotiation: {
    label: "Переговоры",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  client: {
    label: "Клиент",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Отказ",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  },
  blacklist: {
    label: "Чёрный список",
    tone: "border-slate-300 bg-slate-100 text-slate-500",
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
    tone: "border-line bg-slate-50 text-muted",
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
