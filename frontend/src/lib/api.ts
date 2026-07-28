import type {
  Analysis,
  Company,
  CompanyDetail,
  CompanyList,
  CrmBoard,
  ChatResponse,
  CRMStatus,
  DashboardStats,
  OfferResponse,
} from "@/lib/types";

/**
 * Base URL of the backend REST API.
 * In the browser we hit NEXT_PUBLIC_API_URL directly; falls back to localhost.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** Build a querystring, skipping null/undefined/empty values. */
function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      sp.set(key, value ? "true" : "false");
    } else {
      sp.set(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Core fetch wrapper: JSON in / JSON out, throws a rich error on !res.ok. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail =
        typeof data?.detail === "string"
          ? data.detail
          : JSON.stringify(data?.detail ?? data);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      `Ошибка запроса ${res.status}: ${detail || res.statusText}`
    );
  }

  // Some endpoints (204) may have no body.
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export interface SearchBody {
  query: string;
  city?: string;
  country?: string;
  region?: string;
  radius_km?: number;
  limit?: number;
  source?: string;
}

/** Response of POST /search (matches backend SearchResult). */
export interface SearchResult {
  found: number;
  saved: number;
  company_ids: number[];
}

export function searchBusinesses(body: SearchBody): Promise<SearchResult> {
  return request<SearchResult>("/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export interface ListLeadsParams {
  category?: string;
  city?: string;
  status?: CRMStatus | string;
  monitored?: boolean;
  min_score?: number;
  no_website?: boolean;
  has_email?: boolean;
  no_socials?: boolean;
  low_rating?: boolean;
  few_reviews?: boolean;
  no_https?: boolean;
  no_booking?: boolean;
  sort_by_score?: boolean;
  limit?: number;
  offset?: number;
}

export function listLeads(params: ListLeadsParams = {}): Promise<CompanyList> {
  return request<CompanyList>(`/leads${qs(params as Record<string, unknown>)}`);
}

export function getLead(id: number): Promise<CompanyDetail> {
  return request<CompanyDetail>(`/leads/${id}`);
}

export function analyzeLead(id: number): Promise<Analysis> {
  return request<Analysis>(`/leads/${id}/analyze`, { method: "POST" });
}

export function analyzeBatch(
  limit: number,
  only_unanalyzed: boolean
): Promise<{ analyzed: number }> {
  return request<{ analyzed: number }>(
    `/leads/analyze-batch${qs({ limit, only_unanalyzed })}`,
    { method: "POST" }
  );
}

export function toggleMonitor(
  id: number,
  enabled: boolean
): Promise<Company> {
  return request<Company>(`/leads/${id}/monitor${qs({ enabled })}`, {
    method: "POST",
  });
}

/* ------------------------------------------------------------------ */
/* CRM                                                                 */
/* ------------------------------------------------------------------ */

export function updateStatus(
  id: number,
  status: CRMStatus,
  note?: string
): Promise<Company> {
  return request<Company>(`/crm/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function getBoard(): Promise<CrmBoard> {
  return request<CrmBoard>("/crm/board");
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export function generateOffer(
  company_id: number,
  channel: string = "email",
  tone: string = "professional"
): Promise<OfferResponse> {
  return request<OfferResponse>("/campaigns/offer", {
    method: "POST",
    body: JSON.stringify({ company_id, channel, tone }),
  });
}

export interface CampaignMessage {
  id: number;
  company_id: number;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  followup_step: number;
  created_at: string;
}

export function listMessages(
  company_id?: number
): Promise<CampaignMessage[]> {
  return request<CampaignMessage[]>(
    `/campaigns/messages${qs({ company_id })}`
  );
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export function chat(message: string): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export function getDashboard(): Promise<DashboardStats> {
  return request<DashboardStats>("/stats/dashboard");
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function exportCsvUrl(params: ListLeadsParams = {}): string {
  return `${API_BASE}/export/csv${qs(params as Record<string, unknown>)}`;
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

/**
 * `/health` is served at the app root, one level above the `/api` prefix that
 * API_BASE points at, so strip that trailing segment.
 */
function healthUrl(): string {
  return `${API_BASE.replace(/\/api\/?$/, "")}/health`;
}

/** Lightweight liveness probe backing the status pill in the top bar. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(healthUrl(), { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
