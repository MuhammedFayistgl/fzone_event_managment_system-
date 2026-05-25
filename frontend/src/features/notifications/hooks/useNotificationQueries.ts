import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  archiveNotification,
  deleteNotification,
  executeNotificationAction,
  fetchNotifications,
  fetchRecentAlerts,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
} from "../api/notificationApi";
import { useNotificationStore } from "../store/notificationStore";

export function useNotificationFilterParams() {
  const filters = useNotificationStore((s) => s.filters);
  return useMemo(
    () => ({
      category: filters.category,
      priority: filters.priority,
      read: filters.read === "all" ? undefined : filters.read,
      search: filters.search,
    }),
    [filters]
  );
}

export function useUnreadCountQuery() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
    staleTime: 15_000,
    select: (count) => {
      setUnreadCount(count);
      return count;
    },
  });
}

export function useNotificationsInfinite(enabled = true) {
  const params = useNotificationFilterParams();
  return useInfiniteQuery({
    queryKey: notificationKeys.list(params),
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchNotifications({ ...params, page: pageParam, limit: 20 }),
    getNextPageParam: (last) => {
      const { page, totalPages } = last.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useRecentAlertsQuery() {
  return useQuery({
    queryKey: notificationKeys.recent(),
    queryFn: () => fetchRecentAlerts(5),
    staleTime: 30_000,
  });
}

export function useMarkReadMutation() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (data) => {
      setUnreadCount(data.unreadCount);
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (data) => {
      setUnreadCount(data.unreadCount);
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useArchiveNotificationMutation() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: archiveNotification,
    onSuccess: (data) => {
      setUnreadCount(data.unreadCount);
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotificationMutation() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (data) => {
      setUnreadCount(data.unreadCount);
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useExecuteActionMutation() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  return useMutation({
    mutationFn: ({ id, actionId }: { id: string; actionId: string }) =>
      executeNotificationAction(id, actionId),
    onSuccess: (data) => {
      if (data.unreadCount != null) setUnreadCount(data.unreadCount);
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
