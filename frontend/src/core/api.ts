/**
 * Клиент REST API. Без React-зависимостей — этот модуль должен оставаться
 * пригодным для переиспользования в Telegram-боте и Mini App.
 *
 * Особенности, вытекающие из бэкенда:
 *  - поиск и анализ выполняются синхронно, поэтому все методы принимают
 *    AbortSignal: отмена на клиенте — единственный способ прервать ожидание;
 *  - задач и статусов задач нет, опрашивать нечего;
 *  - авторизации нет, заголовков с токеном не отправляем.
 */

import type {
  Analysis,
  Campaign,
  CampaignCreate,
  ChangeHistoryEntry,
  ChatResponse,
  Company,
  CompanyDetail,
  CompanyList,
  CrmBoard,
  DashboardStats,
  ExportRequest,
  ExportResult,
  IntegrationsStatus,
  LeadFilters,
  Message,
  OfferRequest,
  OfferResponse,
  SearchRequest,
  SearchResult,
  SendRequest,
  SendResult,
  StatusHistoryEntry,
} from "./types";
import type { CRMStatus } from "./enums";

/* ------------------------------------------------------------------ */
/* Конфигурация                                                        */
/* ------------------------------------------------------------------ */

/**
 * По умолчанию бьём в same-origin прокси Next (`/api/backend/*` → бэкенд),
 * чтобы CORS не был темой вообще. NEXT_PUBLIC_API_URL позволяет обратиться
 * к бэкенду напрямую, если фронтенд развёрнут отдельно.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api/backend";

/** Демо-режим: интерфейс работает на фикстурах, без бэкенда. */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

/* ------------------------------------------------------------------ */
/* Ошибки                                                             */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;
  /** Сетевой сбой или недоступный бэкенд — отличаем от ответа с кодом ошибки. */
  readonly isNetwork: boolean;

  constructor(
    message: string,
    status: number,
    detail: unknown = null,
    isNetwork = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.isNetwork = isNetwork;
  }

  /** Сообщение, которое не стыдно показать пользователю. */
  get userMessage(): string {
    if (this.isNetwork) {
      return "Бэкенд недоступен. Проверьте, что сервер запущен и адрес API указан верно.";
    }
    switch (this.status) {
      case 404:
        return "Запись не найдена — возможно, она была удалена.";
      case 422:
        return this.message || "Сервер не принял параметры запроса.";
      case 502:
        return "Внешний сервис не ответил. Попробуйте другой источник или повторите позже.";
      case 500:
        return "Внутренняя ошибка сервера.";
      default:
        return this.message || "Не удалось выполнить запрос.";
    }
  }
}

/** Отмена запроса пользователем — не ошибка, обрабатывается отдельно. */
export class AbortedError extends Error {
  constructor() {
    super("Запрос отменён");
    this.name = "AbortedError";
  }
}

export const isAborted = (e: unknown): boolean =>
  e instanceof AbortedError ||
  (e instanceof DOMException && e.name === "AbortError") ||
  (e instanceof Error && e.name === "AbortError");

/* ------------------------------------------------------------------ */
/* Транспорт                                                          */
/* ------------------------------------------------------------------ */

/** Принимает любой плоский объект: типы фильтров описаны интерфейсами, а не индексной подписью. */
function qs(params: object | undefined): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.set(key, typeof value === "boolean" ? String(value) : String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Извлекаем читаемый текст из тела ошибки FastAPI. */
function extractDetail(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    // Ошибка валидации Pydantic: массив объектов с msg и loc.
    if (Array.isArray(d)) {
      return d
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            const loc =
              "loc" in item && Array.isArray((item as { loc: unknown[] }).loc)
                ? (item as { loc: unknown[] }).loc.slice(-1)[0]
                : null;
            const msg = String((item as { msg: unknown }).msg);
            return loc ? `${loc}: ${msg}` : msg;
          }
          return String(item);
        })
        .join("; ");
    }
    return JSON.stringify(d);
  }
  return "";
}

export interface RequestOptions {
  signal?: AbortSignal;
  /** Тело запроса, будет сериализовано в JSON. */
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: object;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { signal, body, method = "GET", query } = opts;

  if (IS_DEMO) {
    const { demoRequest } = await import("./demo");
    return demoRequest<T>(path, { method, body, query, signal });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}${qs(query)}`, {
      method,
      signal,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (isAborted(e)) throw new AbortedError();
    throw new ApiError(
      e instanceof Error ? e.message : "Сетевая ошибка",
      0,
      null,
      true,
    );
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => null);
    }
    throw new ApiError(extractDetail(payload), res.status, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Публичный интерфейс                                                */
/* ------------------------------------------------------------------ */

export const api = {
  /* --- Поиск ------------------------------------------------------- */

  /**
   * Запускает парсинг у провайдера. Выполняется синхронно и может занимать
   * десятки секунд — вызывающая сторона обязана передать signal.
   */
  search(body: SearchRequest, signal?: AbortSignal): Promise<SearchResult> {
    return request<SearchResult>("/search", { method: "POST", body, signal });
  },

  /* --- Лиды -------------------------------------------------------- */

  listLeads(filters: LeadFilters = {}, signal?: AbortSignal): Promise<CompanyList> {
    return request<CompanyList>("/leads", { query: filters, signal });
  },

  getLead(id: number, signal?: AbortSignal): Promise<CompanyDetail> {
    return request<CompanyDetail>(`/leads/${id}`, { signal });
  },

  analyzeLead(id: number, signal?: AbortSignal): Promise<Analysis> {
    return request<Analysis>(`/leads/${id}/analyze`, { method: "POST", signal });
  },

  analyzeBatch(
    params: { limit?: number; only_unanalyzed?: boolean } = {},
    signal?: AbortSignal,
  ): Promise<{ analyzed: number }> {
    return request<{ analyzed: number }>("/leads/analyze-batch", {
      method: "POST",
      query: { limit: params.limit ?? 50, only_unanalyzed: params.only_unanalyzed ?? true },
      signal,
    });
  },

  leadHistory(id: number, signal?: AbortSignal): Promise<ChangeHistoryEntry[]> {
    return request<ChangeHistoryEntry[]>(`/leads/${id}/history`, { signal });
  },

  setMonitor(id: number, enabled: boolean, signal?: AbortSignal): Promise<Company> {
    return request<Company>(`/leads/${id}/monitor`, {
      method: "POST",
      query: { enabled },
      signal,
    });
  },

  /* --- Воронка ----------------------------------------------------- */

  setStatus(
    id: number,
    status: CRMStatus,
    note?: string | null,
    signal?: AbortSignal,
  ): Promise<Company> {
    return request<Company>(`/crm/${id}/status`, {
      method: "PATCH",
      body: { status, note: note ?? null },
      signal,
    });
  },

  statusHistory(id: number, signal?: AbortSignal): Promise<StatusHistoryEntry[]> {
    return request<StatusHistoryEntry[]>(`/crm/${id}/status-history`, { signal });
  },

  board(signal?: AbortSignal): Promise<CrmBoard> {
    return request<CrmBoard>("/crm/board", { signal });
  },

  /* --- Рассылки ---------------------------------------------------- */

  generateOffer(body: OfferRequest, signal?: AbortSignal): Promise<OfferResponse> {
    return request<OfferResponse>("/campaigns/offer", {
      method: "POST",
      body,
      signal,
    });
  },

  createCampaign(body: CampaignCreate, signal?: AbortSignal): Promise<Campaign> {
    return request<Campaign>("/campaigns", { method: "POST", body, signal });
  },

  listCampaigns(signal?: AbortSignal): Promise<Campaign[]> {
    return request<Campaign[]>("/campaigns", { signal });
  },

  listMessages(companyId?: number | null, signal?: AbortSignal): Promise<Message[]> {
    return request<Message[]>("/campaigns/messages", {
      query: { company_id: companyId ?? undefined },
      signal,
    });
  },

  /* --- Чат --------------------------------------------------------- */

  /**
   * Серверный разбор запроса. Понимает ограниченный набор категорий и городов
   * и умеет только фильтровать уже загруженные компании — расширение
   * возможностей живёт в клиентском реестре действий, не здесь.
   */
  chat(message: string, signal?: AbortSignal): Promise<ChatResponse> {
    return request<ChatResponse>("/chat", {
      method: "POST",
      body: { message },
      signal,
    });
  },

  /* --- Статистика -------------------------------------------------- */

  dashboard(signal?: AbortSignal): Promise<DashboardStats> {
    return request<DashboardStats>("/stats/dashboard", { signal });
  },

  /* --- Интеграции -------------------------------------------------- */

  integrationsStatus(signal?: AbortSignal): Promise<IntegrationsStatus> {
    return request<IntegrationsStatus>("/integrations/status", { signal });
  },

  sendEmail(body: SendRequest, signal?: AbortSignal): Promise<SendResult> {
    return request<SendResult>("/integrations/send", {
      method: "POST",
      body,
      signal,
    });
  },

  exportToCrm(body: ExportRequest, signal?: AbortSignal): Promise<ExportResult> {
    return request<ExportResult>("/integrations/export", {
      method: "POST",
      body,
      signal,
    });
  },

  /* --- Экспорт ----------------------------------------------------- */

  /** Ссылка на скачивание CSV. Бэкенд принимает только эти три фильтра. */
  csvUrl(
    params: { has_email?: boolean; no_website?: boolean; min_score?: number | null } = {},
  ): string {
    return `${API_BASE}/export/csv${qs(params)}`;
  },
};

export type Api = typeof api;
