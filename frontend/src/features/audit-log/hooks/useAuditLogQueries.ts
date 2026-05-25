import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  auditLogKeys,
  exportAuditLogs,
  fetchAuditLogAnalytics,
  fetchAuditLogDetail,
  fetchAuditLogEntries,
  fetchAuditLogSummary,
} from "../api/auditLogApi";
import { useAuditLogStore } from "../store/auditLogStore";
import { getDateRangeBounds } from "../utils/formatAuditLog";

export function useAuditLogQueryParams() {
  const filters = useAuditLogStore((s) => s.filters);
  const pagination = useAuditLogStore((s) => s.pagination);
  const sort = useAuditLogStore((s) => s.sort);

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

export function useAuditLogSummary() {
  const params = useAuditLogQueryParams();
  return useQuery({
    queryKey: auditLogKeys.summary(params),
    queryFn: () => fetchAuditLogSummary(params),
  });
}

export function useAuditLogEntries() {
  const params = useAuditLogQueryParams();
  return useQuery({
    queryKey: auditLogKeys.entries(params),
    queryFn: () => fetchAuditLogEntries(params),
  });
}

export function useAuditLogAnalytics() {
  const params = useAuditLogQueryParams();
  return useQuery({
    queryKey: auditLogKeys.analytics(params),
    queryFn: () => fetchAuditLogAnalytics(params),
  });
}

export function useAuditLogDetail(id: string | null) {
  return useQuery({
    queryKey: auditLogKeys.detail(id || ""),
    queryFn: () => fetchAuditLogDetail(id!),
    enabled: Boolean(id),
  });
}

export function useExportAuditLog() {
  const params = useAuditLogQueryParams();
  return useMutation({
    mutationFn: () => exportAuditLogs(params),
  });
}
