export type CRMStatus =
  | "new"
  | "analyzed"
  | "email_sent"
  | "replied"
  | "negotiation"
  | "client"
  | "rejected"
  | "blacklist";

export type Source =
  | "google_maps"
  | "yandex_maps"
  | "2gis"
  | "openstreetmap"
  | "bing_maps"
  | "manual";

export type WebsiteStatus = "ok" | "none" | "broken" | "unreachable";
export type Channel = "email" | "telegram" | "whatsapp" | "sms" | "linkedin";
export type MessageStatus = "draft" | "queued" | "sent" | "replied" | "failed";

export interface WebsiteChecks {
  https?: boolean;
  mobile_friendly?: boolean;
  load_ms?: number | null;
  modern_design?: boolean;
  online_booking?: boolean;
  contact_form?: boolean;
  has_map?: boolean;
  favicon?: boolean;
  title?: string | null;
  meta_description?: boolean;
  h1?: boolean;
  seo?: boolean;
  robots_txt?: boolean;
  sitemap_xml?: boolean;
  [key: string]: unknown;
}

export interface Company {
  id: number;
  source: Source;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socials: Record<string, string>;
  rating: number | null;
  reviews_count: number | null;
  status: CRMStatus;
  ai_score: number | null;
  monitored: boolean;
  created_at: string;
  last_checked_at: string | null;
}

export interface Analysis {
  id: number;
  website_status: WebsiteStatus;
  website_checks: WebsiteChecks;
  gbp_issues: string[];
  social_analysis: Record<string, { found?: boolean; url?: string | null; [key: string]: unknown }>;
  ai_score: number;
  score_breakdown: Record<string, number>;
  possible_services: string[];
  summary: string | null;
  created_at: string;
}

export interface CompanyDetail extends Company {
  description: string | null;
  region: string | null;
  opening_hours: string | null;
  analysis: Analysis | null;
}

export interface CompanyList {
  total: number;
  items: Company[];
}

export interface DashboardStats {
  companies_found: number;
  without_website: number;
  with_email: number;
  very_promising: number;
  emails_sent: number;
  replies: number;
  conversion: number;
}

export interface StatusHistory {
  id: number;
  old_status: CRMStatus | null;
  new_status: CRMStatus;
  note: string | null;
  created_at: string;
}

export interface ChangeHistory {
  id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export interface CrmBoard {
  columns: CRMStatus[];
  board: Record<CRMStatus, Company[]>;
}

export interface Campaign {
  id: number;
  name: string;
  channel: Channel;
  subject_template: string | null;
  body_template: string | null;
  followup_days: string | null;
  status: string;
  created_at: string;
}

export interface CampaignMessage {
  id: number;
  campaign_id: number | null;
  company_id: number;
  channel: Channel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  followup_step: number;
  sent_at: string | null;
  created_at: string;
}

export interface OfferResponse {
  company_id: number;
  channel: Channel;
  subject: string | null;
  body: string;
  used_llm: boolean;
}

export interface ChatResponse {
  reply: string;
  parsed_filters: Record<string, unknown>;
  results: Company[];
  total: number;
}

export interface SearchRequest {
  query: string;
  city?: string;
  country?: string;
  region?: string;
  radius_km?: number;
  limit?: number;
  source?: Source;
}

export interface SearchResult {
  found: number;
  saved: number;
  company_ids: number[];
}

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

export interface IntegrationStatus {
  search: Record<"openstreetmap" | "google_maps" | "yandex_maps" | "2gis", boolean>;
  email: Record<"smtp" | "gmail" | "outlook", boolean>;
  crm_export: Record<"hubspot" | "amocrm" | "bitrix24" | "notion" | "google_sheets", boolean>;
}

export interface ExportResult {
  target: string;
  total: number;
  pushed: number;
  failed: number;
  errors: string[];
}
