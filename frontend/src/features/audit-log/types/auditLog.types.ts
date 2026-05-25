export type AuditCategory =
  | "refund"
  | "block"
  | "export"
  | "payment"
  | "registration"
  | "settings"
  | "webhook"
  | "auth";

export type AuditSeverity = "info" | "warning" | "critical";

export type MetricTrend = "up" | "down";

export type SummaryMetric = {
  value: number;
  changePct: number;
  trend: MetricTrend;
};

export type AuditLogSummary = {
  totalActions: SummaryMetric;
  refunds: SummaryMetric;
  blocks: SummaryMetric;
  exports: SummaryMetric;
  payments: SummaryMetric;
  settings: SummaryMetric;
  last24h: SummaryMetric;
  uniqueActors: SummaryMetric;
};

export type AuditLogEntry = {
  _id: string;
  action: string;
  actionLabel: string;
  category: AuditCategory | string;
  actorId: string | null;
  actorEmail: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  eventId: string | null;
  eventTitle: string | null;
  phone: string;
  ip: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  severity: AuditSeverity;
};

export type AuditLogFilters = {
  category: AuditCategory | "all";
  action: string;
  actorEmail: string;
  actorRole: string;
  eventId: string;
  phone: string;
  targetType: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  dateRange: "today" | "7d" | "30d" | "all" | "custom";
};

export type AuditLogAnalytics = {
  dailyTrend: Array<{ date: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  topActions: Array<{ action: string; label: string; count: number }>;
  topActors: Array<{ actor: string; count: number }>;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const DEFAULT_FILTERS: AuditLogFilters = {
  category: "all",
  action: "all",
  actorEmail: "",
  actorRole: "all",
  eventId: "",
  phone: "",
  targetType: "all",
  search: "",
  dateFrom: "",
  dateTo: "",
  dateRange: "30d",
};
