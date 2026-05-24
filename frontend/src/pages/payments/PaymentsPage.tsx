import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppPageLayout from "../../layouts/AppPageLayout";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { useLivePaymentLedgerSync } from "../../hooks/useLivePaymentLedgerSync";
import { fetchCreatedEvents } from "../../redux/EventThunks";
import {
  fetchPaymentLedger,
  issuePaymentRefund,
  resetPaymentLedgerFilters,
  setPaymentLedgerFilters,
} from "../../redux/Slice/paymentLedgerSlice";
import PaymentsStatsRow from "../../components/payments/PaymentsStatsRow";
import PaymentsToolbar from "../../components/payments/PaymentsToolbar";
import PaymentsLedgerTable from "../../components/payments/PaymentsLedgerTable";
import PaymentDetailDrawer from "../../components/payments/PaymentDetailDrawer";
import PaymentRefundModal from "../../components/payments/PaymentRefundModal";
import { downloadPaymentsCsv, getPaymentDateRangeBounds } from "../../utils/paymentExport";
import API from "../../api/axios";
import type {
  PaymentDateRange,
  PaymentLedgerRow,
  PaymentLedgerStatus,
  RefundReason,
} from "../../Types/paymentLedger.types";

export default function PaymentsPage() {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<PaymentLedgerRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refundRow, setRefundRow] = useState<PaymentLedgerRow | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const events = useAppSelector((s) => s.event.events || []);
  const rows = useAppSelector((s) => s.paymentLedger.rows);
  const statistics = useAppSelector((s) => s.paymentLedger.statistics);
  const pagination = useAppSelector((s) => s.paymentLedger.pagination);
  const filters = useAppSelector((s) => s.paymentLedger.filters);
  const loading = useAppSelector((s) => s.paymentLedger.loading);
  const refundLoading = useAppSelector((s) => s.paymentLedger.refundLoading);
  const initialized = useAppSelector((s) => s.paymentLedger.initialized);

  const eventOptions = useMemo(
    () =>
      events.map((event: any) => ({
        label: event.title || "Untitled event",
        value: String(event._id),
      })),
    [events]
  );

  const loadLedger = useCallback(() => {
    dispatch(fetchPaymentLedger(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchCreatedEvents(""));
  }, [dispatch]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  useLivePaymentLedgerSync(true);

  const updateFilters = (patch: Partial<typeof filters>) => {
    dispatch(
      setPaymentLedgerFilters({
        ...patch,
        page: patch.page ?? 1,
      })
    );
  };

  const handleExport = async () => {
    try {
      const { dateFrom, dateTo } = getPaymentDateRangeBounds(filters.dateRange);
      const res = await API.post("/admin/payment-ledger/export", {
        eventId: filters.eventId || undefined,
        status: filters.status,
        search: filters.search.trim() || undefined,
        dateFrom,
        dateTo,
      });
      const exportRows = res.data?.data?.rows || [];
      if (!exportRows.length) {
        toast.error("No payments match the current filters");
        return;
      }
      downloadPaymentsCsv(exportRows);
      toast.success(`Exported ${exportRows.length} payments`);
    } catch {
      toast.error("Failed to export payments");
    }
  };

  const handleClearFilters = () => {
    dispatch(resetPaymentLedgerFilters());
  };

  const handleView = (row: PaymentLedgerRow) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const handleOpenRefund = (row: PaymentLedgerRow) => {
    setRefundRow(row);
    setRefundModalOpen(true);
  };

  const handleRefundSuccess = (updated: PaymentLedgerRow) => {
    setSelected((current) => (current?._id === updated._id ? updated : current));
    setRefundRow((current) => (current?._id === updated._id ? updated : current));
    loadLedger();
  };

  const handleConfirmRefund = async (payload: {
    amount: number;
    reason: RefundReason;
    note: string;
    revokeAccess: boolean;
  }) => {
    if (!refundRow) return;

    const result = await dispatch(
      issuePaymentRefund({
        paymentId: refundRow._id,
        amount: payload.amount,
        reason: payload.reason,
        note: payload.note,
        revokeAccess: payload.revokeAccess,
      })
    );

    if (issuePaymentRefund.fulfilled.match(result)) {
      const accessMessage = result.payload.accessImpact?.message;
      toast.success(
        accessMessage
          ? `${result.payload.message || "Refund initiated"} — ${accessMessage}`
          : result.payload.message ||
              (result.payload.row.latestRefundStatus === "processed"
                ? "Refund sent via Razorpay to original payment method"
                : "Refund initiated — processing via Razorpay")
      );
      handleRefundSuccess(result.payload.row);
      setRefundModalOpen(false);
      return;
    }

    toast.error(
      typeof result.payload === "string" ? result.payload : "Refund failed"
    );
  };

  return (
    <AppPageLayout
      title="Payments & Revenue"
      subtitle="Finance ledger across all events — filter, audit, export, and issue refunds."
      eyebrow="Revenue Center"
      embedded
      maxWidth="wide"
    >
      <div className="payments-page space-y-5">
        <PaymentsStatsRow
          statistics={statistics}
          loading={loading && !initialized}
        />

        <PaymentsToolbar
          events={eventOptions}
          eventId={filters.eventId}
          status={filters.status}
          dateRange={filters.dateRange}
          search={filters.search}
          total={pagination.total}
          loading={loading}
          onEventChange={(eventId) => updateFilters({ eventId })}
          onStatusChange={(status: PaymentLedgerStatus) => updateFilters({ status })}
          onDateRangeChange={(dateRange: PaymentDateRange) => updateFilters({ dateRange })}
          onSearchChange={(search) => updateFilters({ search })}
          onRefresh={loadLedger}
          onExport={handleExport}
          onClearFilters={handleClearFilters}
        />

        <PaymentsLedgerTable
          rows={rows}
          loading={loading}
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => updateFilters({ page })}
          onView={handleView}
          onRefund={handleOpenRefund}
        />
      </div>

      <PaymentDetailDrawer
        open={drawerOpen}
        row={selected}
        onClose={() => setDrawerOpen(false)}
        onRefund={handleOpenRefund}
      />

      <PaymentRefundModal
        open={refundModalOpen}
        row={refundRow}
        loading={refundLoading}
        onClose={() => setRefundModalOpen(false)}
        onConfirm={handleConfirmRefund}
      />
    </AppPageLayout>
  );
}
