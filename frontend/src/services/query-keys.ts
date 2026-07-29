import type { ListLeadsParams } from "@/types/domain";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  leads: {
    all: ["leads"] as const,
    list: (params: ListLeadsParams) => ["leads", "list", params] as const,
    infinite: (params: ListLeadsParams) => ["leads", "infinite", params] as const,
    detail: (id: number) => ["leads", "detail", id] as const,
    history: (id: number) => ["leads", "history", id] as const,
    statusHistory: (id: number) => ["leads", "status-history", id] as const,
  },
  crm: {
    all: ["crm"] as const,
    board: ["crm", "board"] as const,
  },
  campaigns: {
    all: ["campaigns"] as const,
    list: ["campaigns", "list"] as const,
    messages: (companyId?: number) => ["campaigns", "messages", companyId ?? "all"] as const,
  },
  integrations: ["integrations"] as const,
} as const;
