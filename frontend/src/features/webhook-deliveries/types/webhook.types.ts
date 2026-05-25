export type WebhookStatus = "received" | "processed" | "failed" | "ignored";

export type MetricTrend = "up" | "down";

export type SummaryMetric = {
  value: number;
  changePct: number;
  trend: MetricTrend;
};

export type WebhookSummary = {
  totalDeliveries: SummaryMetric;
  processed: SummaryMetric;
  failed: SummaryMetric;
  ignored: SummaryMetric;
  received: SummaryMetric;
  last24h: SummaryMetric;
  paymentCaptured: SummaryMetric;
  refundEvents: SummaryMetric;
};

export type WebhookDelivery = {
  _id: string;
  provider: string;
  eventType: string;
  eventTypeLabel: string;
  entityId: string;
  status: WebhookStatus | string;
  httpStatus: number | null;
  errorMessage: string;
  payloadSummary: Record<string, unknown>;
  processedAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type WebhookFilters = {
  status: WebhookStatus | "all";
  eventType: string;
  provider: string;
  httpStatus: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  dateRange: "today" | "7d" | "30d" | "all" | "custom";
};

export type WebhookAnalytics = {
  dailyTrend: Array<{ date: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  topEventTypes: Array<{ eventType: string; label: string; count: number }>;
  httpStatusBreakdown: Array<{ httpStatus: number; count: number }>;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const DEFAULT_FILTERS: WebhookFilters = {
  status: "all",
  eventType: "all",
  provider: "all",
  httpStatus: "all",
  search: "",
  dateFrom: "",
  dateTo: "",
  dateRange: "30d",
};

export const EVENT_TYPE_OPTIONS = [
  { label: "All events", value: "all" },
  { label: "Payment captured", value: "payment.captured" },
  { label: "Refund created", value: "refund.created" },
  { label: "Refund processed", value: "refund.processed" },
  { label: "Refund failed", value: "refund.failed" },
  { label: "Payment refunded", value: "payment.refunded" },
  { label: "Webhook error", value: "error" },
  { label: "Unknown", value: "unknown" },
];
