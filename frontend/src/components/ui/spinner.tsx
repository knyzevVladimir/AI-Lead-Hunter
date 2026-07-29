import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export function Spinner({ className, label = "Загрузка" }: { className?: string; label?: string }) {
  return <LoaderCircle className={cn("h-4 w-4 animate-spin", className)} aria-label={label} />;
}
