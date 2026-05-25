import API from "../../../api/axios";
import type {
  ApiResponse,
  AuditLogAnalytics,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogSummary,
} from "../types/auditLog.types";

function toQueryParams(
  filters: Partial<
    AuditLogFilters & {
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

export const auditLogKeys = {
  all: ["audit-log"] as const,
  summary: (filters: Partial<AuditLogFilters>) =>
    [...auditLogKeys.all, "summary", filters] as const,
  entries: (filters: Record<string, unknown>) =>
    [...auditLogKeys.all, "entries", filters] as const,
  detail: (id: string) => [...auditLogKeys.all, "detail", id] as const,
  analytics: (filters: Partial<AuditLogFilters>) =>
    [...auditLogKeys.all, "analytics", filters] as const,
};

export async function fetchAuditLogSummary(filters: Partial<AuditLogFilters>) {
  const qs = toQueryParams(filters);
  const res = await API.get<ApiResponse<AuditLogSummary>>(
    `/admin/platform/audit-logs/summary?${qs}`
  );
  return res.data.data;
}

export async function fetchAuditLogEntries(
  filters: Partial<AuditLogFilters> & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) {
  const qs = toQueryParams(filters);
  const res = await API.get<
    ApiResponse<{
      rows: AuditLogEntry[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  >(`/admin/platform/audit-logs?${qs}`);
  return res.data.data;
}

export async function fetchAuditLogDetail(id: string) {
  const res = await API.get<ApiResponse<AuditLogEntry>>(
    `/admin/platform/audit-logs/${id}`
  );
  return res.data.data;
}

export async function fetchAuditLogAnalytics(filters: Partial<AuditLogFilters>) {
  const qs = toQueryParams(filters);
  const res = await API.get<ApiResponse<AuditLogAnalytics>>(
    `/admin/platform/audit-logs/analytics?${qs}`
  );
  return res.data.data;
}

export async function exportAuditLogs(filters: Partial<AuditLogFilters>) {
  const res = await API.post<ApiResponse<{ rows: AuditLogEntry[] }>>(
    `/admin/platform/audit-logs/export`,
    filters
  );
  return res.data.data.rows;
}
