"use client";

import { cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";

export function Popover({ trigger, children, align = "start", className, open: controlledOpen, onOpenChange }: {
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const renderedTrigger = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: () => void; "aria-expanded"?: boolean }>, {
        onClick: () => setOpen(!open),
        "aria-expanded": open,
      })
    : trigger;

  return (
    <div ref={ref} className="relative inline-flex">
      {renderedTrigger}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={cn("absolute top-[calc(100%+8px)] z-50 min-w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,.14)]", align === "end" ? "right-0" : "left-0", className)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
