import type { AuditCategory } from "../types/auditLog.types";

export function getDateRangeBounds(range: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const end = now.toISOString();
  if (range === "all") return {};
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: end };
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 0;
  if (!days) return {};
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { dateFrom: start.toISOString(), dateTo: end };
}

export function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    refund: "Refund",
    block: "Block",
    export: "Export",
    payment: "Payment",
    registration: "Registration",
    settings: "Settings",
    webhook: "Webhook",
    auth: "Auth",
  };
  return labels[category] || category;
}

export function categoryBadgeClass(category: string): string {
  const map: Record<AuditCategory | string, string> = {
    refund: "audit-log-badge--refund",
    block: "audit-log-badge--block",
    export: "audit-log-badge--export",
    payment: "audit-log-badge--payment",
    registration: "audit-log-badge--registration",
    settings: "audit-log-badge--settings",
    webhook: "audit-log-badge--webhook",
    auth: "audit-log-badge--auth",
  };
  return map[category] || "audit-log-badge--auth";
}

export function severityBadgeClass(severity: string): string {
  if (severity === "critical") return "audit-log-badge--critical";
  if (severity === "warning") return "audit-log-badge--warning";
  return "audit-log-badge--info";
}

export function truncateId(id: string, len = 14) {
  if (!id) return "—";
  return id.length <= len ? id : `${id.slice(0, len)}…`;
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString();
}
