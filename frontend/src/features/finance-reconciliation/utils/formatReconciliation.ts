import { formatCurrency } from "../../../utils/pricing";
import type { ReconciliationStatus } from "../types/reconciliation.types";

export function formatReconciliationStatus(status: ReconciliationStatus): string {
  const labels: Record<ReconciliationStatus, string> = {
    matched: "Matched",
    pending: "Pending",
    failed: "Failed",
    mismatch: "Mismatch",
    refunded: "Refunded",
  };
  return labels[status] || status;
}

export function statusBadgeClass(status: ReconciliationStatus): string {
  const map: Record<ReconciliationStatus, string> = {
    matched: "finance-recon-badge--matched",
    pending: "finance-recon-badge--pending",
    failed: "finance-recon-badge--failed",
    mismatch: "finance-recon-badge--mismatch",
    refunded: "finance-recon-badge--refunded",
  };
  return map[status] || "finance-recon-badge--pending";
}

export function formatAmount(amount: number, currency = "INR") {
  if (currency === "INR") return formatCurrency(amount);
  return `${currency} ${amount.toFixed(2)}`;
}

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

export function truncateId(id: string, len = 12) {
  if (!id) return "—";
  return id.length <= len ? id : `${id.slice(0, len)}…`;
}
