"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Menu, Search, Sparkles } from "lucide-react";
import { checkHealth } from "@/lib/api";
import { useUIStore } from "@/lib/store";

const TITLES: Record<string, string> = {
  "/dashboard": "Дашборд",
  "/leads": "Поиск и лиды",
  "/map": "Карта",
  "/crm": "CRM",
  "/chat": "AI-чат",
  "/campaigns": "Кампании",
  "/settings": "Настройки",
};

/** Live backend liveness pill. */
function BackendStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });

  const online = data === true;

  return (
    <span
      className={clsx(
        "hidden items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors sm:inline-flex",
        isLoading
          ? "border-white/10 bg-white/5 text-muted"
          : online
            ? "border-green-500/30 bg-green-500/10 text-green-300"
            : "border-red-500/30 bg-red-500/10 text-red-300"
      )}
      title={
        online
          ? "Backend отвечает на /health"
          : "Backend недоступен — проверьте, что сервис запущен"
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {online && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={clsx(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            isLoading ? "bg-muted" : online ? "bg-green-400" : "bg-red-400"
          )}
        />
      </span>
      {isLoading ? "Проверка…" : online ? "Backend online" : "Backend offline"}
    </span>
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);
  const [scrolled, setScrolled] = useState(false);

  // Deepen the bar's background once the page scrolls under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const title = TITLES[pathname] ?? "AI Lead Hunter";

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 border-b transition-all duration-300",
        scrolled
          ? "border-white/10 bg-ink/80 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-5 sm:px-8">
        <button
          onClick={toggleMobileNav}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted/70 sm:inline">
            Lead Hunter
          </span>
          <span className="hidden text-muted/40 sm:inline">/</span>
          <span className="truncate text-sm font-semibold text-white">
            {title}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <BackendStatus />

          <Link
            href="/chat"
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:text-white md:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-neon-violet" />
            Спросить AI
          </Link>

          <Link href="/leads" className="btn-primary px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            Найти лиды
          </Link>
        </div>
      </div>
    </header>
  );
}
