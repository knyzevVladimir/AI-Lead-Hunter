/**
 * Типы сущностей бэкенда. Соответствуют контракту один в один — имена полей
 * приходят с сервера и переименованию не подлежат.
 */

import type {
  Channel,
  CRMStatus,
  ServiceType,
  Source,
  WebsiteStatus,
} from "./enums";

/* ------------------------------------------------------------------ */
/* Компания (лид)                                                      */
/* ------------------------------------------------------------------ */

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

export interface WebsiteChecks {
  https: boolean;
  mobile_friendly: boolean;
  load_ms: number | null;
  modern_design: boolean;
  online_booking: boolean;
  contact_form: boolean;
  has_map: boolean;
  favicon: boolean;
  title: string | null;
  meta_description: boolean;
  h1: boolean;
  seo: boolean;
  robots_txt: boolean;
  sitemap_xml: boolean;
}

export interface SocialAnalysisEntry {
  found: boolean;
  url: string | null;
}

export interface Analysis {
  id: number;
  website_status: WebsiteStatus;
  website_checks: Partial<WebsiteChecks> & Record<string, unknown>;
  gbp_issues: string[];
  social_analysis: Record<string, SocialAnalysisEntry>;
  ai_score: number;
  score_breakdown: Record<string, number>;
  possible_services: ServiceType[];
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

/* ------------------------------------------------------------------ */
/* История                                                             */
/* ------------------------------------------------------------------ */

export interface ChangeHistoryEntry {
  id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
}

export interface StatusHistoryEntry {
  id: number;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Поиск                                                               */
/* ------------------------------------------------------------------ */

export interface SearchRequest {
  query: string;
  city?: string | null;
  country?: string | null;
  region?: string | null;
  radius_km?: number | null;
  limit?: number;
  source?: Source;
}

export interface SearchResult {
  found: number;
  saved: number;
  company_ids: number[];
}

/* ------------------------------------------------------------------ */
/* Фильтры списка лидов                                                */
/* ------------------------------------------------------------------ */

export interface LeadFilters {
  category?: string | null;
  city?: string | null;
  status?: CRMStatus | null;
  monitored?: boolean | null;
  min_score?: number | null;
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

/* ------------------------------------------------------------------ */
/* Кампании и сообщения                                               */
/* ------------------------------------------------------------------ */

export interface OfferRequest {
  company_id: number;
  channel?: Channel;
  tone?: string;
}

export interface OfferResponse {
  company_id: number;
  channel: Channel;
  subject: string | null;
  body: string;
  used_llm: boolean;
}

export interface CampaignCreate {
  name: string;
  channel?: Channel;
  subject_template?: string | null;
  body_template?: string | null;
  followup_days?: string;
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

export interface Message {
  id: number;
  campaign_id: number | null;
  company_id: number;
  channel: Channel;
  subject: string | null;
  body: string;
  status: string;
  followup_step: number;
  sent_at: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Чат                                                                */
/* ------------------------------------------------------------------ */

/** Ровно те поля, которые умеет распознавать серверный разбор запроса. */
export interface ParsedFilters {
  category: string | null;
  city: string | null;
  no_website: boolean;
  has_email: boolean;
  no_https: boolean;
  no_socials: boolean;
  low_rating: boolean;
  few_reviews: boolean;
  no_booking: boolean;
  sort_by_score: boolean;
}

export interface ChatResponse {
  reply: string;
  parsed_filters: Partial<ParsedFilters> & Record<string, unknown>;
  results: Company[];
  total: number;
}

/* ------------------------------------------------------------------ */
/* Статистика                                                          */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  companies_found: number;
  without_website: number;
  with_email: number;
  very_promising: number;
  emails_sent: number;
  replies: number;
  conversion: number;
}

/* ------------------------------------------------------------------ */
/* Канбан                                                              */
/* ------------------------------------------------------------------ */

export interface CrmBoard {
  columns: CRMStatus[];
  board: Record<string, Company[]>;
}

/* ------------------------------------------------------------------ */
/* Интеграции                                                          */
/* ------------------------------------------------------------------ */

export interface IntegrationsStatus {
  search: Record<string, boolean>;
  email: Record<string, boolean>;
  crm_export: Record<string, boolean>;
}

export interface SendRequest {
  message_id?: number | null;
  company_id?: number | null;
  provider?: string | null;
  subject?: string | null;
  body?: string | null;
}

export interface SendResult {
  ok: boolean;
  result: Record<string, unknown>;
}

export interface ExportRequest {
  target: string;
  company_ids?: number[] | null;
  has_email?: boolean;
  no_website?: boolean;
  min_score?: number | null;
  limit?: number;
}

export interface ExportResult {
  target: string;
  total: number;
  pushed: number;
  failed: number;
  errors: string[];
}
