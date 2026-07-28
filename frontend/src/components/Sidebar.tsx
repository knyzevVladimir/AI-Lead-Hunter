"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  Search,
  Map,
  KanbanSquare,
  MessageSquare,
  Mail,
  Settings,
  Radar,
  X,
  type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Дашборд",
    icon: LayoutDashboard,
    hint: "Воронка",
  },
  { href: "/leads", label: "Поиск и лиды", icon: Search, hint: "Поиск" },
  { href: "/map", label: "Карта", icon: Map, hint: "Гео" },
  { href: "/crm", label: "CRM", icon: KanbanSquare, hint: "Сделки" },
  { href: "/chat", label: "AI-чат", icon: MessageSquare, hint: "Ассистент" },
  { href: "/campaigns", label: "Кампании", icon: Mail, hint: "Охват" },
  { href: "/settings", label: "Настройки", icon: Settings, hint: "Ключи" },
];

/** Height of one nav row + gap, mirrored by the sliding indicator. */
const ROW_HEIGHT = 46;

/** Animated brand mark: a radar dish with a sweeping beam and a ping ring. */
function RadarMark() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-500/15 ring-1 ring-brand-500/40">
      <div
        aria-hidden
        className="absolute inset-0 animate-radar-sweep"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(59,108,255,0) 0deg, rgba(59,108,255,0) 300deg, rgba(92,140,255,0.55) 360deg)",
        }}
      />
      <span
        aria-hidden
        className="absolute h-2 w-2 animate-pulse-ring rounded-full bg-brand-400/60"
      />
      <Radar className="relative h-5 w-5 text-brand-300" />
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);

  const activeIndex = NAV.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  // Close the drawer whenever the route changes.
  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, closeMobileNav]);

  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={closeMobileNav}
        className={clsx(
          "fixed inset-0 z-40 bg-ink-deep/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileNavOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        aria-hidden
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10",
          "bg-panel/70 backdrop-blur-2xl",
          "transition-transform duration-300 ease-smooth lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <RadarMark />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-white">
              AI Lead Hunter
            </div>
            <div className="text-[11px] text-muted">поиск и охват клиентов</div>
          </div>

          <button
            onClick={closeMobileNav}
            className="ml-auto rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav. The active pill is a single element that slides between rows
            rather than a background toggling on and off each link. */}
        <nav className="relative flex-1 px-3">
          {activeIndex >= 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-0 h-[42px] rounded-lg bg-brand-500/15 ring-1 ring-brand-500/40 transition-transform duration-500 ease-spring"
              style={{ transform: `translateY(${activeIndex * ROW_HEIGHT}px)` }}
            >
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-400 shadow-[0_0_12px_2px_rgba(92,140,255,0.8)]" />
            </div>
          )}

          <ul className="relative space-y-1">
            {NAV.map(({ href, label, icon: Icon, hint }, i) => {
              const active = i === activeIndex;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "group relative flex h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
                      active
                        ? "text-white"
                        : "text-muted hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon
                      className={clsx(
                        "h-[18px] w-[18px] shrink-0 transition-all duration-300",
                        active
                          ? "scale-110 text-brand-300"
                          : "text-muted group-hover:scale-110 group-hover:text-white"
                      )}
                    />
                    <span>{label}</span>
                    <span
                      className={clsx(
                        "ml-auto text-[10px] uppercase tracking-wide transition-all duration-200",
                        active
                          ? "text-brand-300/70"
                          : "translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-muted/60"
                      )}
                    >
                      {hint}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-5">
          <div className="rounded-lg border border-white/10 bg-ink/60 p-3 text-[11px] leading-relaxed text-muted">
            Ключи интеграций настраиваются в{" "}
            <span className="text-white/80">backend .env</span>. Яндекс.Карты и
            OSM работают без ключей.
          </div>
        </div>
      </aside>
    </>
  );
}
