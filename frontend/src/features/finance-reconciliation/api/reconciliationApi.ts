import API from "../../../api/axios";
import type {
  ActivityItem,
  ApiResponse,
  ReconciliationAnalytics,
  ReconciliationFilters,
  ReconciliationSummary,
  ReconciliationTransaction,
  TransactionDetail,
} from "../types/reconciliation.types";

function toQueryParams(filters: Partial<ReconciliationFilters & { page?: number; limit?: number; sortBy?: string; sortOrder?: string; range?: string }>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== "" && value !== "all") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export const reconciliationKeys = {
  all: ["reconciliation"] as const,
  summary: (filters: Partial<ReconciliationFilters>) =>
    [...reconciliationKeys.all, "summary", filters] as const,
  transactions: (filters: Record<string, unknown>) =>
    [...reconciliationKeys.all, "transactions", filters] as const,
  detail: (id: string) => [...reconciliationKeys.all, "detail", id] as const,
  analytics: (filters: Partial<ReconciliationFilters>) =>
    [...reconciliationKeys.all, "analytics", filters] as const,
  activity: () => [...reconciliationKeys.all, "activity"] as const,
};

export async function fetchReconciliationSummary(filters: Partial<ReconciliationFilters>) {
  const qs = toQueryParams(filters);
  const res = await API.get<ApiResponse<ReconciliationSummary>>(
    `/admin/platform/reconciliation/summary?${qs}`
  );
  return res.data.data;
}

export async function fetchReconciliationTransactions(
  filters: Partial<ReconciliationFilters> & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) {
  const qs = toQueryParams(filters);
  const res = await API.get<
    ApiResponse<{
      rows: ReconciliationTransaction[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  >(`/admin/platform/reconciliation/transactions?${qs}`);
  return res.data.data;
}

export async function fetchReconciliationDetail(id: string) {
  const res = await API.get<ApiResponse<TransactionDetail>>(
    `/admin/platform/reconciliation/transactions/${id}`
  );
  return res.data.data;
}

export async function fetchReconciliationAnalytics(
  filters: Partial<ReconciliationFilters>
) {
  const qs = toQueryParams(filters);
  const res = await API.get<ApiResponse<ReconciliationAnalytics>>(
    `/admin/platform/reconciliation/analytics?${qs}`
  );
  return res.data.data;
}

export async function fetchReconciliationActivity() {
  const res = await API.get<ApiResponse<ActivityItem[]>>(
    `/admin/platform/reconciliation/activity`
  );
  return res.data.data;
}

export async function exportReconciliation(filters: Partial<ReconciliationFilters>) {
  const res = await API.post<ApiResponse<{ rows: ReconciliationTransaction[] }>>(
    `/admin/platform/reconciliation/export`,
    filters
  );
  return res.data.data.rows;
}

export async function resolveReconciliationTransaction(id: string, note?: string) {
  const res = await API.post<ApiResponse<TransactionDetail>>(
    `/admin/platform/reconciliation/transactions/${id}/resolve`,
    { note }
  );
  return res.data;
}
