import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import API from "../../api/axios";
import { getPaymentDateRangeBounds } from "../../utils/paymentExport";
import type {
  PaymentLedgerFilters,
  PaymentLedgerPagination,
  PaymentLedgerRow,
  PaymentLedgerStatistics,
  RefundAccessImpact,
  IssueRefundPayload,
} from "../../Types/paymentLedger.types";

type LedgerState = {
  rows: PaymentLedgerRow[];
  statistics: PaymentLedgerStatistics;
  pagination: PaymentLedgerPagination;
  filters: PaymentLedgerFilters;
  loading: boolean;
  refundLoading: boolean;
  error: string | null;
  initialized: boolean;
};

const defaultStatistics: PaymentLedgerStatistics = {
  totalRevenue: 0,
  successfulCount: 0,
  failedCount: 0,
  pendingCount: 0,
  refundedCount: 0,
  refundedAmount: 0,
};

const initialState: LedgerState = {
  rows: [],
  statistics: defaultStatistics,
  pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
  filters: {
    page: 1,
    limit: 25,
    eventId: "",
    status: "all",
    search: "",
    dateRange: "all",
  },
  loading: false,
  refundLoading: false,
  error: null,
  initialized: false,
};

export const fetchPaymentLedger = createAsyncThunk(
  "paymentLedger/fetch",
  async (filters: PaymentLedgerFilters, { rejectWithValue }) => {
    try {
      const { dateFrom, dateTo } = getPaymentDateRangeBounds(filters.dateRange);
      const res = await API.post("/admin/payment-ledger", {
        page: filters.page,
        limit: filters.limit,
        eventId: filters.eventId || undefined,
        status: filters.status,
        search: filters.search.trim() || undefined,
        dateFrom,
        dateTo,
      });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load payment ledger"
      );
    }
  }
);

export const issuePaymentRefund = createAsyncThunk(
  "paymentLedger/refund",
  async (payload: IssueRefundPayload, { rejectWithValue }) => {
    try {
      const res = await API.post(`/admin/payments/${payload.paymentId}/refund`, {
        amount: payload.amount,
        reason: payload.reason,
        note: payload.note,
        revokeAccess: payload.revokeAccess,
      });
      return {
        row: res.data?.data as PaymentLedgerRow,
        message: res.data?.message as string | undefined,
        accessImpact: res.data?.accessImpact as RefundAccessImpact | null | undefined,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to process refund"
      );
    }
  }
);

const paymentLedgerSlice = createSlice({
  name: "paymentLedger",
  initialState,
  reducers: {
    setPaymentLedgerFilters: (
      state,
      action: PayloadAction<Partial<PaymentLedgerFilters>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetPaymentLedgerFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.rows = action.payload?.payments || [];
        state.statistics = action.payload?.statistics || defaultStatistics;
        state.pagination = action.payload?.pagination || state.pagination;
      })
      .addCase(fetchPaymentLedger.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to load payment ledger";
      })
      .addCase(issuePaymentRefund.pending, (state) => {
        state.refundLoading = true;
        state.error = null;
      })
      .addCase(issuePaymentRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        const updated = action.payload.row;
        if (!updated?._id) return;
        const index = state.rows.findIndex((row) => row._id === updated._id);
        if (index >= 0) {
          state.rows[index] = updated;
        }
      })
      .addCase(issuePaymentRefund.rejected, (state, action) => {
        state.refundLoading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to process refund";
      });
  },
});

export const { setPaymentLedgerFilters, resetPaymentLedgerFilters } =
  paymentLedgerSlice.actions;

export default paymentLedgerSlice.reducer;
