"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command, Menu, Plus, Search, Server } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useShell } from "@/providers/shell-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import { ROUTE_META } from "@/theme/navigation";

export function Header() {
  const pathname = usePathname();
  const { setMobileSidebarOpen, setCommandOpen } = useShell();
  const basePath = `/${pathname.split("/").filter(Boolean)[0] ?? "dashboard"}`;
  const route = ROUTE_META[basePath];
  const integrationQuery = useQuery({ queryKey: queryKeys.integrations, queryFn: api.getIntegrationStatus, staleTime: 120_000 });
  const connected = integrationQuery.data ? Object.values(integrationQuery.data).flatMap((group) => Object.values(group)).filter(Boolean).length : 0;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6 xl:px-8">
        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Открыть меню"><Menu className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm"><span className="hidden text-slate-400 sm:inline">Workspace</span><span className="hidden text-slate-300 sm:inline">/</span><span className="truncate font-medium text-slate-800">{route?.label ?? "AI Lead Hunter"}</span></div>
        </div>

        <button type="button" onClick={() => setCommandOpen(true)} className="hidden h-9 w-[min(320px,28vw)] items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white md:flex">
          <Search className="h-4 w-4" /><span className="flex-1 text-left">Найти страницу или лид</span><kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]"><Command className="h-2.5 w-2.5" />K</kbd>
        </button>

        <Tooltip content={integrationQuery.isError ? "Backend недоступен" : `${connected} подключений`}>
          <div className="hidden h-9 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3 text-xs text-slate-500 sm:flex">
            <span className={`h-2 w-2 rounded-full ${integrationQuery.isError ? "bg-rose-500" : integrationQuery.isLoading ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`} />
            <Server className="h-3.5 w-3.5" /> API
          </div>
        </Tooltip>

        <Link href="/search" className="hidden h-8 items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white shadow-[0_1px_2px_rgba(79,70,229,.2)] transition hover:bg-violet-700 sm:inline-flex">
          <Plus className="h-3.5 w-3.5" />Новый поиск
        </Link>
        <Link href="/search" className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-violet-600 text-white sm:hidden" aria-label="Новый поиск"><Plus className="h-4 w-4" /></Link>
      </div>
    </header>
  );
}
