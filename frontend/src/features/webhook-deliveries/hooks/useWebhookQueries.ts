import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  webhookKeys,
  exportWebhooks,
  fetchWebhookAnalytics,
  fetchWebhookDetail,
  fetchWebhookEntries,
  fetchWebhookSummary,
} from "../api/webhookApi";
import { useWebhookStore } from "../store/webhookStore";
import { getDateRangeBounds } from "../utils/formatWebhook";

export function useWebhookQueryParams() {
  const filters = useWebhookStore((s) => s.filters);
  const pagination = useWebhookStore((s) => s.pagination);
  const sort = useWebhookStore((s) => s.sort);

  return useMemo(() => {
    const rangeBounds = getDateRangeBounds(filters.dateRange);
    return {
      ...filters,
      ...rangeBounds,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    };
  }, [filters, pagination, sort]);
}

export function useWebhookSummary() {
  const params = useWebhookQueryParams();
  return useQuery({
    queryKey: webhookKeys.summary(params),
    queryFn: () => fetchWebhookSummary(params),
  });
}

export function useWebhookEntries() {
  const params = useWebhookQueryParams();
  return useQuery({
    queryKey: webhookKeys.entries(params),
    queryFn: () => fetchWebhookEntries(params),
  });
}

export function useWebhookAnalytics() {
  const params = useWebhookQueryParams();
  return useQuery({
    queryKey: webhookKeys.analytics(params),
    queryFn: () => fetchWebhookAnalytics(params),
  });
}

export function useWebhookDetail(id: string | null) {
  return useQuery({
    queryKey: webhookKeys.detail(id || ""),
    queryFn: () => fetchWebhookDetail(id!),
    enabled: Boolean(id),
  });
}

export function useExportWebhooks() {
  const params = useWebhookQueryParams();
  return useMutation({
    mutationFn: () => exportWebhooks(params),
  });
}
