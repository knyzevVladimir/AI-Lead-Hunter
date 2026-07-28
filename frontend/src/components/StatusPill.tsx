import clsx from "clsx";
import type { CRMStatus } from "@/lib/types";

interface StatusMeta {
  label: string;
  /** Tailwind classes for the pill border/bg/text — kept as a single string
   *  so callers can spread it directly via clsx. */
  tone: string;
  /** Tailwind bg class for the status dot (exported for the kanban board). */
  dot: string;
  /** Optional extra glow class applied to the "client" terminal state. */
  glow?: string;
}

export const STATUS_META: Record<CRMStatus, StatusMeta> = {
  new: {
    label: "Новый",
    tone: "border-slate-500/40 bg-slate-500/15 text-slate-300",
    dot: "bg-slate-400",
  },
  analyzed: {
    label: "Проанализирован",
    tone: "border-blue-500/40 bg-blue-500/15 text-blue-300",
    dot: "bg-blue-400",
  },
  email_sent: {
    label: "Письмо отправлено",
    tone: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
    dot: "bg-indigo-400",
  },
  replied: {
    label: "Ответил",
    tone: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
    dot: "bg-cyan-400",
  },
  negotiation: {
    label: "Переговоры",
    tone: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400",
  },
  client: {
    label: "Клиент",
    /* Gradient tint: green with a subtle cyan glint */
    tone: "border-green-500/50 bg-green-500/20 text-green-200",
    dot: "bg-green-400",
    glow: "shadow-[0_0_12px_-3px_rgba(34,197,94,0.65)]",
  },
  rejected: {
    label: "Отказ",
    tone: "border-red-500/40 bg-red-500/15 text-red-300",
    dot: "bg-red-400",
  },
  blacklist: {
    label: "Чёрный список",
    tone: "border-zinc-500/40 bg-zinc-500/15 text-zinc-400",
    dot: "bg-zinc-500",
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

/**
 * Maps each status to its dot colour Tailwind class.
 * Exported so the kanban board can drop its local dotColor helper and stay
 * in sync with the pill colours without duplicating the map.
 */
export const STATUS_DOT: Record<CRMStatus, string> = Object.fromEntries(
  Object.entries(STATUS_META).map(([k, v]) => [k, v.dot])
) as Record<CRMStatus, string>;

interface StatusPillProps {
  status: CRMStatus;
  className?: string;
}

/**
 * Toned status pill used in the leads table and CRM board.
 *
 * Each status gets a gradient-tinted background that matches its colour band.
 * The terminal "client" state additionally emits a faint green glow so it reads
 * as the positive end-state at a glance.
 */
export default function StatusPill({ status, className }: StatusPillProps) {
  const meta = STATUS_META[status] ?? {
    label: status,
    tone: "border-white/10 bg-white/5 text-muted",
    dot: "bg-white/40",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        "transition-all duration-300",
        meta.tone,
        meta.glow,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
