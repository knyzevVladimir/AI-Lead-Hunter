import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/theme/constants";
import type { CRMStatus } from "@/types/domain";

export function StatusBadge({ status }: { status: CRMStatus }) {
  const meta = STATUS_META[status];
  const tone = meta.color === "slate" ? "neutral" : meta.color as "blue" | "violet" | "cyan" | "amber" | "emerald" | "rose" | "zinc";
  return <Badge tone={tone} dot>{meta.label}</Badge>;
}
