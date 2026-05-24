import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { checkInvestorPaymentStatus, createPaymentOrder, verifyPayment } from "./EventThunks";
import type {
  PricingBreakdown,
  SuccessPaymentRecord,
  UserRefundEntry,
  UserRefundStatus,
} from "../utils/pricing";

interface PaymentState {
  loading: boolean;
  syncing: boolean;
  order: any;
  error: string | null;
  verified: boolean;
  alreadyPaid: boolean;
  paidTotal: number;
  grossPaidTotal: number;
  totalRefunded: number;
  refundStatus: UserRefundStatus;
  refunds: UserRefundEntry[];
  requiredTotal: number;
  breakdown: PricingBreakdown | null;
  successPayments: SuccessPaymentRecord[];
}

const initialState: PaymentState = {
  loading: false,
  syncing: false,
  order: null,
  error: null,
  verified: false,
  alreadyPaid: false,
  paidTotal: 0,
  grossPaidTotal: 0,
  totalRefunded: 0,
  refundStatus: "none",
  refunds: [],
  requiredTotal: 0,
  breakdown: null,
  successPayments: [],
};

function applyPaidPayload(
  state: PaymentState,
  payload: {
    paidTotal?: number;
    grossPaidTotal?: number;
    totalRefunded?: number;
    refundStatus?: UserRefundStatus;
    refunds?: UserRefundEntry[];
    requiredTotal?: number;
    breakdown?: PricingBreakdown | null;
    successPayments?: SuccessPaymentRecord[];
  }
) {
  if (payload.paidTotal !== undefined) {
    state.paidTotal = Number(payload.paidTotal);
  }
  if (payload.grossPaidTotal !== undefined) {
    state.grossPaidTotal = Number(payload.grossPaidTotal);
  }
  if (payload.totalRefunded !== undefined) {
    state.totalRefunded = Number(payload.totalRefunded);
  }
  if (payload.refundStatus !== undefined) {
    state.refundStatus = payload.refundStatus;
  }
  if (payload.refunds !== undefined) {
    state.refunds = payload.refunds;
  }
  if (payload.requiredTotal !== undefined) {
    state.requiredTotal = payload.requiredTotal;
  }
  if (payload.breakdown !== undefined) {
    state.breakdown = payload.breakdown;
  }
  if (payload.successPayments !== undefined) {
    state.successPayments = payload.successPayments;
  }
  if (state.requiredTotal <= 0 || state.paidTotal >= state.requiredTotal) {
    state.alreadyPaid = true;
  }
}

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    resetPaymentState: (state) => {
      state.alreadyPaid = false;
      state.order = null;
      state.error = null;
      state.paidTotal = 0;
      state.grossPaidTotal = 0;
      state.totalRefunded = 0;
      state.refundStatus = "none";
      state.refunds = [];
      state.requiredTotal = 0;
      state.breakdown = null;
      state.verified = false;
      state.syncing = false;
      state.successPayments = [];
    },
    setPaymentSyncing: (state, action: PayloadAction<boolean>) => {
      state.syncing = action.payload;
    },
    setPaymentRequirement: (
      state,
      action: PayloadAction<{
        requiredTotal?: number;
        breakdown?: PricingBreakdown | null;
        paidTotal?: number;
        grossPaidTotal?: number;
        totalRefunded?: number;
        refundStatus?: UserRefundStatus;
        refunds?: UserRefundEntry[];
        alreadyPaid?: boolean;
        successPayments?: SuccessPaymentRecord[];
      }>
    ) => {
      if (action.payload.requiredTotal !== undefined) {
        state.requiredTotal = action.payload.requiredTotal;
      }
      if (action.payload.breakdown !== undefined) {
        state.breakdown = action.payload.breakdown;
      }
      if (action.payload.paidTotal !== undefined) {
        state.paidTotal = action.payload.paidTotal;
      }
      if (action.payload.grossPaidTotal !== undefined) {
        state.grossPaidTotal = action.payload.grossPaidTotal;
      }
      if (action.payload.totalRefunded !== undefined) {
        state.totalRefunded = action.payload.totalRefunded;
      }
      if (action.payload.refundStatus !== undefined) {
        state.refundStatus = action.payload.refundStatus;
      }
      if (action.payload.refunds !== undefined) {
        state.refunds = action.payload.refunds;
      }
      if (action.payload.successPayments !== undefined) {
        state.successPayments = action.payload.successPayments;
      }
      if (action.payload.alreadyPaid !== undefined) {
        state.alreadyPaid = action.payload.alreadyPaid;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload.order ?? null;
        applyPaidPayload(state, action.payload);
        if (action.payload.paymentRequired === false) {
          state.alreadyPaid = true;
        }
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (typeof payload === "string") {
          state.error = payload;
          return;
        }
        state.error = payload?.message || "Payment order failed";
        if (payload?.paidTotal !== undefined) {
          applyPaidPayload(state, payload);
          state.alreadyPaid = true;
        }
      })
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.verified = true;
        applyPaidPayload(state, action.payload);
        state.alreadyPaid = true;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.error =
          typeof payload === "string"
            ? payload
            : payload?.message || "Verification failed";
      })
      .addCase(checkInvestorPaymentStatus.pending, (state) => {
        state.syncing = true;
      })
      .addCase(checkInvestorPaymentStatus.fulfilled, (state, action) => {
        state.syncing = false;
        state.loading = false;
        state.paidTotal = Number(action.payload?.paidTotal ?? 0);
        state.grossPaidTotal = Number(action.payload?.grossPaidTotal ?? 0);
        state.totalRefunded = Number(action.payload?.totalRefunded ?? 0);
        state.refundStatus = action.payload?.refundStatus || "none";
        state.refunds = action.payload?.refunds || [];
        if (action.payload?.successPayments) {
          state.successPayments = action.payload.successPayments;
        }
        if (
          action.payload?.status === "success" ||
          Number(action.payload?.paidTotal ?? 0) > 0
        ) {
          state.verified = true;
        }
      })
      .addCase(checkInvestorPaymentStatus.rejected, (state) => {
        state.syncing = false;
      });
  },
});

export const { resetPaymentState, setPaymentRequirement, setPaymentSyncing } =
  paymentSlice.actions;
export default paymentSlice.reducer;
