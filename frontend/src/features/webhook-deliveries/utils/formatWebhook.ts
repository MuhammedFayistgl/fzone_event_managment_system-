import type { WebhookStatus } from "../types/webhook.types";

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

export function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    processed: "Processed",
    failed: "Failed",
    ignored: "Ignored",
    received: "Received",
  };
  return labels[status] || status;
}

export function statusBadgeClass(status: string): string {
  const map: Record<WebhookStatus | string, string> = {
    processed: "webhook-badge--processed",
    failed: "webhook-badge--failed",
    ignored: "webhook-badge--ignored",
    received: "webhook-badge--received",
  };
  return map[status] || "webhook-badge--ignored";
}

export function truncateId(id: string, len = 14) {
  if (!id) return "—";
  return id.length <= len ? id : `${id.slice(0, len)}…`;
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function truncateError(msg: string, len = 48) {
  if (!msg) return "—";
  return msg.length <= len ? msg : `${msg.slice(0, len)}…`;
}

export function hasPaymentLink(row: {
  entityId?: string;
  payloadSummary?: Record<string, unknown>;
}) {
  const paymentId = row.payloadSummary?.paymentId;
  const entityId = row.entityId || "";
  return Boolean(
    paymentId ||
      entityId.startsWith("pay_") ||
      entityId.startsWith("rfnd_") ||
      row.payloadSummary?.orderId
  );
}
