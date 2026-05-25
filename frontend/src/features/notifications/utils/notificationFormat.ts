import type { AppNotification } from "../types/notification.types";

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function groupLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  if (d >= startToday) return "Today";
  if (d >= startYesterday) return "Yesterday";
  return "Earlier";
}

export function groupNotifications(rows: AppNotification[]) {
  const groups: Record<string, AppNotification[]> = {};
  for (const row of rows) {
    const label = groupLabel(row.createdAt);
    groups[label] = groups[label] || [];
    groups[label].push(row);
  }
  return groups;
}
