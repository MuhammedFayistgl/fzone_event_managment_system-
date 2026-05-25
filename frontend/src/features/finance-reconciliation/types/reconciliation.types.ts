export type ReconciliationStatus =
  | "matched"
  | "pending"
  | "failed"
  | "mismatch"
  | "refunded";

export type SettlementStatus = "settled" | "pending" | "unknown";

export type PaymentStatus = "created" | "success" | "failed" | "refunded";

export type MetricTrend = "up" | "down";

export type SummaryMetric = {
  value: number;
  changePct: number;
  trend: MetricTrend;
};

export type ReconciliationSummary = {
  totalTransactions: SummaryMetric;
  reconciled: SummaryMetric;
  pending: SummaryMetric;
  failed: SummaryMetric;
  revenueProcessed: SummaryMetric;
  settlementAmount: SummaryMetric;
  disputed: SummaryMetric;
  refunds: SummaryMetric;
  note?: string;
};

export type ReconciliationTransaction = {
  _id: string;
  eventId: string;
  event: { _id: string; title?: string; isRefundable?: boolean } | null;
  phone: string;
  investorName: string | null;
  investorCode: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  guestCount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  reconciliationStatus: ReconciliationStatus;
  settlementStatus: SettlementStatus;
  gateway: string;
  gatewayAmount: number | null;
  ledgerNet: number;
  variance: number;
  gatewayStatus: string | null;
  reconciliationReviewedAt: string | null;
  reconciliationNote: string;
  latestRefundStatus?: string | null;
};

export type ReconciliationFilters = {
  eventId: string;
  status: string;
  reconciliationStatus: ReconciliationStatus | "all";
  settlementStatus: SettlementStatus | "all";
  method: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  search: string;
  dateRange: "today" | "7d" | "30d" | "all" | "custom";
};

export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReconciliationAnalytics = {
  dailyTrend: Array<{
    date: string;
    total: number;
    revenue: number;
    failed: number;
    matched: number;
  }>;
  revenueByDay: Array<{ date: string; amount: number }>;
  failedByDay: Array<{ date: string; count: number }>;
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
  monthlySettlements: Array<{ month: string; amount: number; count: number }>;
};

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  at: string;
  status: "info" | "success" | "warning" | "error";
  meta?: Record<string, unknown>;
};

export type ActivityItem = {
  id: string;
  source: "audit" | "webhook";
  title: string;
  description: string;
  at: string;
  status: "info" | "success" | "error";
};

export type TransactionDetail = {
  transaction: ReconciliationTransaction;
  timeline: TimelineEvent[];
  gatewayResponse: Record<string, unknown> | null;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const DEFAULT_FILTERS: ReconciliationFilters = {
  eventId: "",
  status: "all",
  reconciliationStatus: "all",
  settlementStatus: "all",
  method: "all",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  search: "",
  dateRange: "30d",
};
