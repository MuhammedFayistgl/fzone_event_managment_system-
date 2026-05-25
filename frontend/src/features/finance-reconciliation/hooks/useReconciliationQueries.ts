import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  exportReconciliation,
  fetchReconciliationActivity,
  fetchReconciliationAnalytics,
  fetchReconciliationDetail,
  fetchReconciliationSummary,
  fetchReconciliationTransactions,
  reconciliationKeys,
  resolveReconciliationTransaction,
} from "../api/reconciliationApi";
import { useReconciliationStore } from "../store/reconciliationStore";
import { getDateRangeBounds } from "../utils/formatReconciliation";

export function useReconciliationQueryParams() {
  const filters = useReconciliationStore((s) => s.filters);
  const pagination = useReconciliationStore((s) => s.pagination);
  const sort = useReconciliationStore((s) => s.sort);

  return useMemo(() => {
    const rangeBounds = getDateRangeBounds(filters.dateRange);
    return {
      ...filters,
      ...rangeBounds,
      ...(filters.dateRange === "custom" && filters.dateFrom
        ? { dateFrom: filters.dateFrom }
        : {}),
      ...(filters.dateRange === "custom" && filters.dateTo
        ? { dateTo: filters.dateTo }
        : {}),
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    };
  }, [filters, pagination, sort]);
}

export function useReconciliationSummary() {
  const params = useReconciliationQueryParams();
  return useQuery({
    queryKey: reconciliationKeys.summary(params),
    queryFn: () => fetchReconciliationSummary(params),
  });
}

export function useReconciliationTransactions() {
  const params = useReconciliationQueryParams();
  return useQuery({
    queryKey: reconciliationKeys.transactions(params),
    queryFn: () => fetchReconciliationTransactions(params),
  });
}

export function useReconciliationAnalytics() {
  const params = useReconciliationQueryParams();
  return useQuery({
    queryKey: reconciliationKeys.analytics(params),
    queryFn: () => fetchReconciliationAnalytics(params),
  });
}

export function useReconciliationActivity() {
  return useQuery({
    queryKey: reconciliationKeys.activity(),
    queryFn: fetchReconciliationActivity,
  });
}

export function useReconciliationDetail(id: string | null) {
  return useQuery({
    queryKey: reconciliationKeys.detail(id || ""),
    queryFn: () => fetchReconciliationDetail(id!),
    enabled: Boolean(id),
  });
}

export function useResolveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      resolveReconciliationTransaction(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reconciliationKeys.all });
    },
  });
}

export function useExportReconciliation() {
  const params = useReconciliationQueryParams();
  return useMutation({
    mutationFn: () => exportReconciliation(params),
  });
}
