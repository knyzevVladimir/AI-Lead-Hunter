"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/leads", label: "Поиск и лиды", icon: Search },
  { href: "/map", label: "Карта", icon: Map },
  { href: "/crm", label: "CRM", icon: KanbanSquare },
  { href: "/chat", label: "AI-чат", icon: MessageSquare },
  { href: "/campaigns", label: "Кампании", icon: Mail },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-panel/60 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/40">
          <Radar className="h-5 w-5 text-brand-500" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white">
            AI Lead Hunter
          </div>
          <div className="text-[11px] text-muted">поиск и охват клиентов</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-500/15 text-white ring-1 ring-brand-500/40"
                  : "text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={clsx(
                  "h-[18px] w-[18px] shrink-0",
                  active
                    ? "text-brand-500"
                    : "text-muted group-hover:text-white"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5">
        <div className="rounded-lg border border-white/10 bg-ink/60 p-3 text-[11px] leading-relaxed text-muted">
          Ключи интеграций настраиваются в{" "}
          <span className="text-white/80">backend .env</span>. OSM работает
          без ключей.
        </div>
      </div>
    </aside>
  );
}
