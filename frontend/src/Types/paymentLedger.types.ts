export type PaymentLedgerStatus =
  | "all"
  | "success"
  | "failed"
  | "pending"
  | "refunded";

export type PaymentDateRange = "all" | "today" | "7d" | "30d";

export type RefundReason =
  | "duplicate_payment"
  | "event_cancelled"
  | "customer_request"
  | "other";

export type RefundStatus = "pending" | "processed" | "failed";

export type PaymentRefundEntry = {
  refundId: string;
  amount: number;
  reason: RefundReason | string;
  note?: string;
  status?: RefundStatus;
  razorpayReceipt?: string;
  speedRequested?: string;
  speedProcessed?: string;
  failureReason?: string;
  initiatedAt?: string;
  processedAt?: string | null;
  refundedAt?: string;
};

export type PaymentLedgerStatistics = {
  totalRevenue: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
  refundedAmount: number;
};

export type PaymentLedgerRow = {
  _id: string;
  eventId?: string;
  event?: {
    _id: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    isRefundable?: boolean;
  } | null;
  phone: string;
  investorName?: string | null;
  investorCode?: string | null;
  amount: number;
  currency: string;
  status: "created" | "success" | "failed" | "refunded";
  method?: string | null;
  guestCount?: number;
  breakdown?: {
    investorAmount?: number;
    guestAmount?: number;
    guestCount?: number;
    payableGuestCount?: number;
    freeGuestCount?: number;
  } | null;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  refundedAt?: string | null;
  refundAmount?: number | null;
  refundReason?: RefundReason | string | null;
  refunds?: PaymentRefundEntry[];
  latestRefundStatus?: RefundStatus | null;
  isRefundable?: boolean;
  refundableRemaining?: number;
  canRefund?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type RefundAccessImpact = {
  paidTotal: number;
  requiredTotal: number;
  coveredGuestCount: number;
  investorBlocked: boolean;
  guestsBlocked: number[];
  message: string;
};

export type IssueRefundPayload = {
  paymentId: string;
  amount?: number;
  reason: RefundReason;
  note?: string;
  revokeAccess?: boolean;
};

export type PaymentLedgerFilters = {
  page: number;
  limit: number;
  eventId: string;
  status: PaymentLedgerStatus;
  search: string;
  dateRange: PaymentDateRange;
};

export type PaymentLedgerPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
