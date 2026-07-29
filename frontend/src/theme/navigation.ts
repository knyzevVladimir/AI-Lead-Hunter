import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, Cable, LayoutDashboard, Map, Megaphone, Search, Settings, TableProperties, Workflow } from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const NAVIGATION: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
  { href: "/search", label: "Поиск", shortLabel: "Поиск", icon: Search, shortcut: "S" },
  { href: "/map", label: "Карта", shortLabel: "Карта", icon: Map },
  { href: "/leads", label: "Лиды", shortLabel: "Лиды", icon: TableProperties, shortcut: "L" },
  { href: "/crm", label: "CRM", shortLabel: "CRM", icon: Workflow, shortcut: "C" },
  { href: "/campaigns", label: "Кампании", shortLabel: "Кампании", icon: Megaphone },
  { href: "/analytics", label: "Аналитика", shortLabel: "Аналитика", icon: BarChart3 },
  { href: "/chat", label: "AI Chat", shortLabel: "AI Chat", icon: Bot },
  { href: "/integrations", label: "Интеграции", shortLabel: "Интеграции", icon: Cable },
  { href: "/settings", label: "Настройки", shortLabel: "Настройки", icon: Settings },
];

export const ROUTE_META = Object.fromEntries(NAVIGATION.map((item) => [item.href, item])) as Record<string, NavigationItem>;
