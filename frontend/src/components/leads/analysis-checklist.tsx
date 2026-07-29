import { Check, Gauge, Globe2, Map, Minus, Search, ShieldCheck, Smartphone, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WebsiteChecks } from "@/types/domain";
import { cn } from "@/utils/cn";

const checks: Array<{ key: keyof WebsiteChecks; label: string; description: string; icon: React.ElementType }> = [
  { key: "https", label: "SSL / HTTPS", description: "Защищённое соединение", icon: ShieldCheck },
  { key: "mobile_friendly", label: "Mobile", description: "Адаптация под смартфоны", icon: Smartphone },
  { key: "load_ms", label: "Speed", description: "Скорость загрузки", icon: Gauge },
  { key: "seo", label: "SEO", description: "Title, description и H1", icon: Search },
  { key: "robots_txt", label: "Robots", description: "robots.txt доступен", icon: Globe2 },
  { key: "sitemap_xml", label: "Sitemap", description: "sitemap.xml доступен", icon: Map },
  { key: "modern_design", label: "Design", description: "Современный интерфейс", icon: Sparkles },
  { key: "online_booking", label: "Booking", description: "Онлайн-запись", icon: Check },
];

export function AnalysisChecklist({ data }: { data: WebsiteChecks }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{checks.map((item) => {
    const raw = data[item.key];
    const success = item.key === "load_ms" ? typeof raw === "number" && raw <= 3000 : raw === true;
    const missing = raw === null || raw === undefined;
    const Icon = item.icon;
    return <Card key={item.key as string} className="p-4 shadow-none"><div className="flex items-start gap-3"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", missing ? "bg-slate-100 text-slate-400" : success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-800">{item.label}</p>{missing ? <Minus className="h-3.5 w-3.5 text-slate-300" /> : success ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-600" />}</div><p className="mt-1 text-[10px] leading-4 text-slate-400">{item.key === "load_ms" && typeof raw === "number" ? `${raw} мс` : item.description}</p></div></div></Card>;
  })}</div>;
}
