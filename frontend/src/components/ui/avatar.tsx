import { initials } from "@/utils/format";
import { cn } from "@/utils/cn";

const palette = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm", xl: "h-16 w-16 text-xl" };
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-semibold ring-1 ring-inset ring-black/[.04]", palette[seed % palette.length], sizes[size], className)} aria-label={name}>
      {initials(name)}
    </span>
  );
}
