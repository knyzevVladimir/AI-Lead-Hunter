import { API_BASE, apiRequest, toQuery } from "@/services/http";
import type {
  Analysis,
  Campaign,
  CampaignMessage,
  ChangeHistory,
  Channel,
  ChatResponse,
  Company,
  CompanyDetail,
  CompanyList,
  CRMStatus,
  CrmBoard,
  DashboardStats,
  ExportResult,
  IntegrationStatus,
  ListLeadsParams,
  OfferResponse,
  SearchRequest,
  SearchResult,
  StatusHistory,
} from "@/types/domain";

export const api = {
  search: (body: SearchRequest) =>
    apiRequest<SearchResult>("/search", { method: "POST", body: JSON.stringify(body) }),

  listLeads: (params: ListLeadsParams = {}) =>
    apiRequest<CompanyList>(`/leads${toQuery(params as Record<string, unknown>)}`),

  getLead: (id: number) => apiRequest<CompanyDetail>(`/leads/${id}`),

  getLeadsByIds: (ids: number[]) => Promise.all(ids.map((id) => apiRequest<CompanyDetail>(`/leads/${id}`))),

  analyzeLead: (id: number) => apiRequest<Analysis>(`/leads/${id}/analyze`, { method: "POST" }),

  analyzeBatch: (limit = 50, onlyUnanalyzed = true) =>
    apiRequest<{ analyzed: number }>(`/leads/analyze-batch${toQuery({ limit, only_unanalyzed: onlyUnanalyzed })}`, {
      method: "POST",
    }),

  toggleMonitor: (id: number, enabled: boolean) =>
    apiRequest<Company>(`/leads/${id}/monitor${toQuery({ enabled })}`, { method: "POST" }),

  getLeadHistory: (id: number) => apiRequest<ChangeHistory[]>(`/leads/${id}/history`),

  updateStatus: (id: number, status: CRMStatus, note?: string) =>
    apiRequest<Company>(`/crm/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),

  getStatusHistory: (id: number) => apiRequest<StatusHistory[]>(`/crm/${id}/status-history`),

  getCrmBoard: () => apiRequest<CrmBoard>("/crm/board"),

  getDashboard: () => apiRequest<DashboardStats>("/stats/dashboard"),

  listCampaigns: () => apiRequest<Campaign[]>("/campaigns"),

  createCampaign: (body: {
    name: string;
    channel: Channel;
    subject_template?: string;
    body_template?: string;
    followup_days?: string;
  }) => apiRequest<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(body) }),

  listMessages: (companyId?: number) =>
    apiRequest<CampaignMessage[]>(`/campaigns/messages${toQuery({ company_id: companyId })}`),

  generateOffer: (companyId: number, channel: Channel = "email", tone = "professional") =>
    apiRequest<OfferResponse>("/campaigns/offer", {
      method: "POST",
      body: JSON.stringify({ company_id: companyId, channel, tone }),
    }),

  sendMessage: (body: {
    message_id?: number;
    company_id?: number;
    provider?: string;
    subject?: string;
    body?: string;
  }) => apiRequest<{ ok: boolean; result: Record<string, unknown> }>("/integrations/send", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  getIntegrationStatus: () => apiRequest<IntegrationStatus>("/integrations/status"),

  exportToIntegration: (body: {
    target: string;
    company_ids?: number[];
    has_email?: boolean;
    no_website?: boolean;
    min_score?: number;
    limit?: number;
  }) => apiRequest<ExportResult>("/integrations/export", { method: "POST", body: JSON.stringify(body) }),

  chat: (message: string) =>
    apiRequest<ChatResponse>("/chat", { method: "POST", body: JSON.stringify({ message }) }),

  exportCsvUrl: (params: Pick<ListLeadsParams, "has_email" | "no_website" | "min_score"> = {}) =>
    `${API_BASE}/export/csv${toQuery(params as Record<string, unknown>)}`,
};
