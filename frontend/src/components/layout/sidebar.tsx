"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { useShell } from "@/providers/shell-provider";
import { NAVIGATION } from "@/theme/navigation";
import { cn } from "@/utils/cn";

const primary = NAVIGATION.slice(0, 8);
const system = NAVIGATION.slice(8);

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, setCommandOpen } = useShell();

  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className={cn("flex h-16 items-center border-b border-slate-100", sidebarCollapsed ? "justify-center px-3" : "justify-between px-4")}>
        <Logo compact={sidebarCollapsed} />
        {!sidebarCollapsed && <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden" onClick={() => setMobileSidebarOpen(false)} aria-label="Закрыть меню"><X className="h-4 w-4" /></button>}
      </div>

      <div className={cn("px-3 pt-3", sidebarCollapsed && "px-2")}>
        <Tooltip content="Глобальный поиск · Ctrl K" side="bottom" className="w-full">
          <button type="button" onClick={() => setCommandOpen(true)} className={cn("flex h-9 w-full items-center rounded-[10px] border border-slate-200 bg-slate-50 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-800", sidebarCollapsed ? "justify-center px-0" : "gap-2.5 px-3")}>
            <Search className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <><span className="flex-1 text-left">Поиск</span><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-400">⌘ K</kbd></>}
          </button>
        </Tooltip>
      </div>

      <nav className={cn("flex-1 overflow-y-auto px-3 py-4", sidebarCollapsed && "px-2")} aria-label="Основная навигация">
        <NavGroup items={primary} pathname={pathname} collapsed={sidebarCollapsed} onNavigate={() => setMobileSidebarOpen(false)} />
        <div className={cn("my-4 h-px bg-slate-100", sidebarCollapsed && "mx-2")} />
        {!sidebarCollapsed && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Workspace</p>}
        <NavGroup items={system} pathname={pathname} collapsed={sidebarCollapsed} onNavigate={() => setMobileSidebarOpen(false)} />
      </nav>

      <div className={cn("border-t border-slate-100 p-3", sidebarCollapsed && "px-2")}>
        <button type="button" className={cn("flex w-full items-center rounded-xl transition hover:bg-slate-50", sidebarCollapsed ? "justify-center p-1" : "gap-3 p-2")}>
          <span className="relative"><Avatar name="Vladimir Knyazev" size="md" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" /></span>
          {!sidebarCollapsed && <span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-semibold text-slate-800">Vladimir Knyazev</span><span className="block truncate text-[11px] text-slate-400">Workspace owner</span></span>}
        </button>
      </div>

      <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="absolute -right-3 top-[82px] hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-800 lg:flex" aria-label={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}>
        {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </div>
  );

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-50 hidden border-r border-slate-200/70 bg-white transition-[width] duration-200 lg:block", sidebarCollapsed ? "w-[76px]" : "w-[248px]")}>{content}</aside>
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <motion.button type="button" aria-label="Закрыть меню" className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]" onClick={() => setMobileSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className="absolute inset-y-0 left-0 w-[min(300px,88vw)] border-r border-slate-200 bg-white shadow-2xl" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.2, ease: "easeOut" }}>{content}</motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavGroup({ items, pathname, collapsed, onNavigate }: { items: typeof NAVIGATION; pathname: string; collapsed: boolean; onNavigate: () => void }) {
  return <div className="space-y-0.5">{items.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const link = (
      <Link href={item.href} onClick={onNavigate} className={cn("group relative flex h-9 items-center rounded-[10px] text-sm font-medium transition", collapsed ? "justify-center px-0" : "gap-2.5 px-2.5", active ? "bg-slate-950 text-white shadow-[0_1px_3px_rgba(15,23,42,.18)]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900")}>
        <item.icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
    return collapsed ? <Tooltip key={item.href} content={item.label} side="bottom" className="w-full">{link}</Tooltip> : <span key={item.href} className="block">{link}</span>;
  })}</div>;
}
