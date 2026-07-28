"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { getBoard, updateStatus } from "@/lib/api";
import type { Company, CRMStatus } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";
import { STATUS_META, STATUS_ORDER, statusLabel } from "@/components/StatusPill";

export default function CrmPage() {
  const queryClient = useQueryClient();

  const boardQuery = useQuery({
    queryKey: ["crm", "board"],
    queryFn: getBoard,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CRMStatus }) =>
      updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const columns: CRMStatus[] = boardQuery.data?.columns ?? STATUS_ORDER;
  const board = boardQuery.data?.board ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">CRM</h1>
          <p className="page-subtitle">
            Канбан-доска сделок. Меняйте статус лида прямо на карточке.
          </p>
        </div>
        {boardQuery.isFetching && !boardQuery.isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-faint" />
        )}
      </div>

      {boardQuery.isLoading && (
        <div className="flex items-center gap-3 py-16 text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          Загрузка доски…
        </div>
      )}

      {boardQuery.isError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Не удалось загрузить CRM-доску.
        </div>
      )}

      {boardQuery.data && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => {
            const cards = board[status] ?? [];
            const meta = STATUS_META[status];
            return (
              <div
                key={status}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-line bg-slate-50/80"
              >
                {/* Column header */}
                <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${dotColor(status)}`}
                    />
                    <span className="text-sm font-semibold text-ink">
                      {meta?.label ?? status}
                    </span>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 p-3">
                  {cards.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-faint">
                      Пусто
                    </div>
                  ) : (
                    cards.map((c) => (
                      <CrmCard
                        key={c.id}
                        company={c}
                        pending={
                          statusMutation.isPending &&
                          (statusMutation.variables as { id: number })?.id ===
                            c.id
                        }
                        onChange={(newStatus) =>
                          statusMutation.mutate({
                            id: c.id,
                            status: newStatus,
                          })
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CrmCard({
  company,
  pending,
  onChange,
}: {
  company: Company;
  pending: boolean;
  onChange: (status: CRMStatus) => void;
}) {
  return (
    <div className="card card-hover bg-white p-3">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-snug text-ink">
          {company.name}
        </div>
        <ScoreBadge score={company.ai_score} className="min-w-0 shrink-0" />
      </div>

      {company.city && (
        <div className="mb-2 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" />
          {company.city}
        </div>
      )}

      <div className="relative">
        <select
          value={company.status}
          disabled={pending}
          onChange={(e) => onChange(e.target.value as CRMStatus)}
          className="w-full rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        {pending && (
          <Loader2 className="pointer-events-none absolute right-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-faint" />
        )}
      </div>
    </div>
  );
}

/** Small dot color matching the status tone. */
function dotColor(status: CRMStatus): string {
  const map: Record<CRMStatus, string> = {
    new: "bg-slate-400",
    analyzed: "bg-blue-500",
    email_sent: "bg-indigo-500",
    replied: "bg-cyan-500",
    negotiation: "bg-amber-500",
    client: "bg-emerald-500",
    rejected: "bg-rose-500",
    blacklist: "bg-slate-500",
  };
  return map[status] ?? "bg-slate-300";
}
