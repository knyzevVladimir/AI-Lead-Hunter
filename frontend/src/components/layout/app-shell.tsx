"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CommandMenu } from "@/components/layout/command-menu";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useShell } from "@/providers/shell-provider";
import { cn } from "@/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { sidebarCollapsed, setMobileSidebarOpen } = useShell();
  useEffect(() => setMobileSidebarOpen(false), [pathname, setMobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <a href="#main-content" className="fixed left-4 top-3 z-[200] -translate-y-20 rounded-lg bg-slate-950 px-3 py-2 text-sm text-white transition focus:translate-y-0">К контенту</a>
      <Sidebar />
      <div className={cn("min-h-screen transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[248px]")}>
        <Header />
        <motion.main id="main-content" key={pathname} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-8">
          {children}
        </motion.main>
      </div>
      <CommandMenu />
    </div>
  );
}
