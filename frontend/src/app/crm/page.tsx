"use client";

import { useCallback, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import clsx from "clsx";
import { Loader2, MapPin, Kanban, AlertCircle } from "lucide-react";
import { getBoard, updateStatus } from "@/lib/api";
import type { Company, CRMStatus } from "@/lib/types";
import ScoreRing from "@/components/charts/ScoreRing";
import Reveal from "@/components/motion/Reveal";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import { STATUS_META, STATUS_DOT, STATUS_ORDER, statusLabel } from "@/components/StatusPill";

/* ------------------------------------------------------------------ */
/* Drag state is kept in a ref to avoid re-renders during a drag       */
/* ------------------------------------------------------------------ */

interface DragState {
  id: number;
  fromStatus: CRMStatus;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CrmPage() {
  const queryClient = useQueryClient();

  // Which card is being dragged (id + source column)
  const dragRef = useRef<DragState | null>(null);

  // Which column is currently highlighted as a drop target
  const [dropTarget, setDropTarget] = useState<CRMStatus | null>(null);

  // Track the card id that is visually "lifted" (opacity/scale)
  const [draggingId, setDraggingId] = useState<number | null>(null);

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

  // Total cards across all columns, for the per-column progress bar
  const totalCards = Object.values(board).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  /* ---- Drag event handlers ---- */

  const handleDragStart = useCallback(
    (e: React.DragEvent, company: Company) => {
      dragRef.current = { id: company.id, fromStatus: company.status };
      setDraggingId(company.id);
      // Standard dataTransfer so native DnD works across browsers
      e.dataTransfer.setData("text/plain", String(company.id));
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  // Counter for child enters/leaves — prevents flicker when pointer moves
  // between child elements inside the column drop zone.
  const enterCounters = useRef<Map<CRMStatus, number>>(new Map());

  const handleDragEnter = useCallback(
    (e: React.DragEvent, status: CRMStatus) => {
      e.preventDefault();
      const count = (enterCounters.current.get(status) ?? 0) + 1;
      enterCounters.current.set(status, count);
      setDropTarget(status);
    },
    []
  );

  const handleDragLeave = useCallback(
    (_e: React.DragEvent, status: CRMStatus) => {
      const count = Math.max(0, (enterCounters.current.get(status) ?? 1) - 1);
      enterCounters.current.set(status, count);
      // Only clear highlight when the pointer truly left the column
      if (count === 0) {
        setDropTarget((prev) => (prev === status ? null : prev));
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Required to make the column a valid drop target
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toStatus: CRMStatus) => {
      e.preventDefault();
      enterCounters.current.set(toStatus, 0);
      setDropTarget(null);
      setDraggingId(null);

      const drag = dragRef.current;
      dragRef.current = null;

      if (!drag) return;
      // No-op when dropping onto the same column
      if (drag.fromStatus === toStatus) return;

      statusMutation.mutate({ id: drag.id, status: toStatus });
    },
    [statusMutation]
  );

  /* ---- Render ---- */

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page header */}
      <Reveal from="down" duration={500}>
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow mb-1 flex items-center gap-2">
              <Kanban className="h-3.5 w-3.5" />
              Управление сделками
            </div>
            <h1 className="page-title">CRM-доска</h1>
            <p className="page-subtitle">
              Перетащите карточку в нужную колонку или выберите статус в
              выпадающем списке.
            </p>
          </div>

          {/* Background refetch indicator */}
          {boardQuery.isFetching && !boardQuery.isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted" />
          )}
        </div>
      </Reveal>

      {/* Loading state — skeleton columns */}
      {boardQuery.isLoading && <SkeletonBoard />}

      {/* Error state */}
      {boardQuery.isError && (
        <Reveal>
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Не удалось загрузить CRM-доску. Проверьте, что backend запущен.
          </div>
        </Reveal>
      )}

      {/* Kanban board */}
      {boardQuery.data && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status, colIdx) => {
            const cards = board[status] ?? [];
            const meta = STATUS_META[status];
            const dotClass = STATUS_DOT[status];
            const isTarget = dropTarget === status;
            const progress = totalCards > 0 ? cards.length / totalCards : 0;

            return (
              <Reveal
                key={status}
                from="up"
                delay={colIdx * 60}
                duration={450}
                className="shrink-0"
              >
                {/* Column drop zone */}
                <div
                  onDragEnter={(e) => handleDragEnter(e, status)}
                  onDragLeave={(e) => handleDragLeave(e, status)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  className={clsx(
                    "flex w-72 flex-col rounded-xl border transition-all duration-200",
                    // Base surface
                    "bg-panel/60 backdrop-blur-sm",
                    // Highlight when a card is hovering over this column
                    isTarget
                      ? "border-brand-500/60 bg-panel/80 shadow-glow"
                      : "border-white/10"
                  )}
                >
                  {/* Column header */}
                  <div className="border-b border-white/10 px-4 pb-3 pt-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "h-2 w-2 rounded-full",
                            dotClass,
                            // Pulse the dot on the active drop target
                            isTarget && "animate-pulse"
                          )}
                        />
                        <span className="text-sm font-semibold text-white">
                          {meta?.label ?? status}
                        </span>
                      </div>

                      {/* Animated card count */}
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-muted tabular-nums">
                        <AnimatedNumber
                          value={cards.length}
                          duration={600}
                          delay={colIdx * 60 + 400}
                        />
                      </span>
                    </div>

                    {/* Progress bar — this column's share of all cards */}
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={clsx(
                          "h-full origin-left rounded-full transition-all duration-700",
                          dotClass
                        )}
                        style={{ transform: `scaleX(${progress})` }}
                      />
                    </div>
                  </div>

                  {/* Cards list */}
                  <div className="flex-1 space-y-2 p-3">
                    {/* Dashed insertion placeholder shown while a card hovers */}
                    {isTarget && draggingId !== null && (
                      <div className="rounded-lg border border-dashed border-brand-500/50 bg-brand-500/5 py-3 text-center text-xs text-brand-300/70 animate-fade-in">
                        Переместить сюда
                      </div>
                    )}

                    {cards.length === 0 && !isTarget ? (
                      <EmptyColumn />
                    ) : (
                      cards.map((c, cardIdx) => (
                        <CrmCard
                          key={c.id}
                          company={c}
                          cardIndex={cardIdx}
                          columnIndex={colIdx}
                          isDragging={draggingId === c.id}
                          pending={
                            statusMutation.isPending &&
                            (
                              statusMutation.variables as { id: number }
                            )?.id === c.id
                          }
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
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
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CRM Card                                                            */
/* ------------------------------------------------------------------ */

interface CrmCardProps {
  company: Company;
  cardIndex: number;
  columnIndex: number;
  isDragging: boolean;
  pending: boolean;
  onDragStart: (e: React.DragEvent, company: Company) => void;
  onDragEnd: () => void;
  onChange: (status: CRMStatus) => void;
}

function CrmCard({
  company,
  cardIndex,
  columnIndex,
  isDragging,
  pending,
  onDragStart,
  onDragEnd,
  onChange,
}: CrmCardProps) {
  return (
    <Reveal
      from="up"
      delay={columnIndex * 60 + cardIndex * 45 + 200}
      duration={400}
    >
      <div
        draggable
        onDragStart={(e) => onDragStart(e, company)}
        onDragEnd={onDragEnd}
        className={clsx(
          "card card-hover cursor-grab p-3 active:cursor-grabbing",
          // Visual lift state while this specific card is being dragged
          isDragging
            ? "scale-95 rotate-1 opacity-40 shadow-lift"
            : "opacity-100",
          "transition-all duration-200"
        )}
      >
        {/* Top row: company name + score ring */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-snug text-white">
              {company.name}
            </div>
            {company.category && (
              <div className="mt-0.5 truncate text-[11px] text-muted">
                {company.category}
              </div>
            )}
          </div>
          <ScoreRing
            score={company.ai_score}
            size={40}
            stroke={3}
            delay={columnIndex * 60 + cardIndex * 45 + 500}
            className="shrink-0"
          />
        </div>

        {/* City */}
        {company.city && (
          <div className="mb-3 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{company.city}</span>
          </div>
        )}

        {/* Status select — accessible / touch fallback */}
        <div className="relative">
          <select
            value={company.status}
            disabled={pending}
            onChange={(e) => onChange(e.target.value as CRMStatus)}
            className={clsx(
              "w-full rounded-md border border-white/10 bg-panel px-2 py-1.5",
              "text-xs text-white/90 transition-all duration-200",
              "hover:border-white/20 focus:border-brand-500 focus:outline-none",
              "focus:ring-1 focus:ring-brand-500/40 disabled:opacity-50"
            )}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s} className="bg-panel">
                {statusLabel(s)}
              </option>
            ))}
          </select>
          {pending && (
            <Loader2 className="pointer-events-none absolute right-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Empty column                                                        */
/* ------------------------------------------------------------------ */

function EmptyColumn() {
  return (
    <div className="rounded-lg border border-dashed border-white/10 px-3 py-8 text-center">
      <p className="text-xs text-muted/60">Пусто</p>
      <p className="mt-1 text-[10px] text-muted/40">
        Перетащите карточку сюда
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton board shown while the first fetch is in flight            */
/* ------------------------------------------------------------------ */

function SkeletonBoard() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex w-72 shrink-0 flex-col rounded-xl border border-white/10 bg-panel/60"
        >
          {/* Skeleton header */}
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton h-5 w-6 rounded-full" />
            </div>
            <div className="mt-2 skeleton h-0.5 w-full rounded-full" />
          </div>
          {/* Skeleton cards */}
          <div className="space-y-2 p-3">
            {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
              <div key={j} className="skeleton h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
