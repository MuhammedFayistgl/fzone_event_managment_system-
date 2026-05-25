import API from "../../../api/axios";
import type { AppNotification } from "../types/notification.types";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

function toParams(filters: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") params.set(k, String(v));
  });
  return params.toString();
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters: Record<string, unknown>) =>
    [...notificationKeys.all, "list", filters] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
  recent: () => [...notificationKeys.all, "recent"] as const,
};

export async function fetchNotifications(filters: Record<string, unknown> = {}) {
  const qs = toParams(filters);
  const res = await API.get<
    ApiResponse<{
      rows: AppNotification[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  >(`/admin/notifications?${qs}`);
  return res.data.data;
}

export async function fetchUnreadCount() {
  const res = await API.get<ApiResponse<{ count: number }>>(
    "/admin/notifications/unread-count"
  );
  return res.data.data.count;
}

export async function fetchRecentAlerts(limit = 5) {
  const res = await API.get<ApiResponse<{ rows: AppNotification[] }>>(
    `/admin/notifications/recent-alerts?limit=${limit}`
  );
  return res.data.data.rows;
}

export async function markNotificationRead(id: string) {
  const res = await API.post<ApiResponse<{ unreadCount: number }>>(
    `/admin/notifications/${id}/read`
  );
  return res.data.data;
}

export async function markAllNotificationsRead() {
  const res = await API.post<ApiResponse<{ unreadCount: number; modified: number }>>(
    "/admin/notifications/read-all"
  );
  return res.data.data;
}

export async function archiveNotification(id: string) {
  const res = await API.post<ApiResponse<{ unreadCount: number }>>(
    `/admin/notifications/${id}/archive`
  );
  return res.data.data;
}

export async function deleteNotification(id: string) {
  const res = await API.delete<ApiResponse<{ unreadCount: number }>>(
    `/admin/notifications/${id}`
  );
  return res.data.data;
}

export async function executeNotificationAction(id: string, actionId: string) {
  const res = await API.post<
    ApiResponse<{
      success: boolean;
      kind: string;
      url?: string;
      message?: string;
      unreadCount: number;
    }>
  >(`/admin/notifications/${id}/actions/${actionId}`);
  return res.data.data;
}
