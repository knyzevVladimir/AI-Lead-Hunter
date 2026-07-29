import { Badge } from "@/components/ui/badge";
import { SOURCE_META } from "@/theme/constants";
import type { Source } from "@/types/domain";

export function SourceBadge({ source }: { source: Source }) {
  return <Badge>{SOURCE_META[source]?.short ?? source}</Badge>;
}
