export type CRMStatus =
  | "new"
  | "analyzed"
  | "email_sent"
  | "replied"
  | "negotiation"
  | "client"
  | "rejected"
  | "blacklist";

export interface Company {
  id: number;
  source: string;
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
  website_status: "ok" | "none" | "broken" | "unreachable";
  website_checks: Record<string, any>;
  gbp_issues: string[];
  social_analysis: Record<string, any>;
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

export interface OfferResponse {
  company_id: number;
  channel: string;
  subject: string | null;
  body: string;
  used_llm: boolean;
}

export interface ChatResponse {
  reply: string;
  parsed_filters: Record<string, any>;
  results: Company[];
  total: number;
}

export interface CrmBoard {
  columns: CRMStatus[];
  board: Record<string, Company[]>;
}
