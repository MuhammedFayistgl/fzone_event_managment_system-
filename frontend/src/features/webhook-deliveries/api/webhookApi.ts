import API from "../../../api/axios";
import type {
  ApiResponse,
  WebhookAnalytics,
  WebhookDelivery,
  WebhookFilters,
  WebhookSummary,
} from "../types/webhook.types";

function toQueryParams(
  filters: Partial<
    WebhookFilters & {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      range?: string;
    }
  >
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== "" && value !== "all") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export const webhookKeys = {
  all: ["webhook-deliveries"] as const,
  summary: (filters: Partial<WebhookFilters>) =>
    [...webhookKeys.all, "summary", filters] as const,
  entries: (filters: Record<string, unknown>) =>
    [...webhookKeys.all, "entries", filters] as const,
  detail: (id: string) => [...webhookKeys.all, "detail", id] as const,
  analytics: (filters: Partial<WebhookFilters>) =>
    [...webhookKeys.all, "analytics", filters] as const,
};

export async function fetchWebhookSummary(filters: Partial<WebhookFilters>) {
  const qs = toQueryParams(filters);
  const res = await API.get<ApiResponse<WebhookSummary>>(
    `/admin/platform/webhooks/summary?${qs}`
  );
  return res.data.data;
}

export async function fetchWebhookEntries(
  filters: Partial<WebhookFilters> & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) {
  const qs = toQueryParams(filters);
  const res = await API.get<
    ApiResponse<{
      rows: WebhookDelivery[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  >(`/admin/platform/webhooks?${qs}`);
  return res.data.data;
}

export async function fetchWebhookDetail(id: string) {
  const res = await API.get<ApiResponse<WebhookDelivery>>(
    `/admin/platform/webhooks/${id}`
  );
  return res.data.data;
}

export async function fetchWebhookAnalytics(filters: Partial<WebhookFilters>) {
  const qs = toQueryParams(filters);
  const res = await API.get<ApiResponse<WebhookAnalytics>>(
    `/admin/platform/webhooks/analytics?${qs}`
  );
  return res.data.data;
}

export async function exportWebhooks(filters: Partial<WebhookFilters>) {
  const res = await API.post<ApiResponse<{ rows: WebhookDelivery[] }>>(
    `/admin/platform/webhooks/export`,
    filters
  );
  return res.data.data.rows;
}
