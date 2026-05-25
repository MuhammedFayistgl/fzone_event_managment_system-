import { Eye, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { formatCurrency } from "../../utils/pricing";
import type { PaymentLedgerRow } from "../../Types/paymentLedger.types";

function StatusBadge({ row }: { row: PaymentLedgerRow }) {
  const partial =
    row.status === "success" && Number(row.refundAmount || 0) > 0;

  if (partial) {
    return (
      <div className="payments-status-stack">
        <span className="payments-status-badge payments-status-badge--partial">
          Partially refunded
        </span>
        {row.latestRefundStatus === "pending" && (
          <span className="payments-refund-status payments-refund-status--pending">
            Refund pending
          </span>
        )}
      </div>
    );
  }

  const map = {
    success: { label: "Success", className: "payments-status-badge--success" },
    failed: { label: "Failed", className: "payments-status-badge--failed" },
    created: { label: "Pending", className: "payments-status-badge--pending" },
    refunded: { label: "Refunded", className: "payments-status-badge--refunded" },
  } as const;

  const item = map[row.status] || map.created;
  return (
    <div className="payments-status-stack">
      <span className={`payments-status-badge ${item.className}`}>{item.label}</span>
      {row.latestRefundStatus === "pending" && row.status !== "refunded" && (
        <span className="payments-refund-status payments-refund-status--pending">
          Refund pending
        </span>
      )}
    </div>
  );
}

function truncateId(id?: string | null, start = 10, end = 6) {
  if (!id) return "—";
  if (id.length <= start + end + 3) return id;
  return `${id.slice(0, start)}…${id.slice(-end)}`;
}

function formatWhen(row: PaymentLedgerRow) {
  const raw = row.paidAt || row.createdAt;
  if (!raw) return "—";
  return new Date(raw).toLocaleString();
}

type Props = {
  rows: PaymentLedgerRow[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (row: PaymentLedgerRow) => void;
  onRefund?: (row: PaymentLedgerRow) => void;
  isHighlighted?: (row: PaymentLedgerRow) => boolean;
};

export default function PaymentsLedgerTable({
  rows,
  loading = false,
  page,
  totalPages,
  onPageChange,
  onView,
  onRefund,
  isHighlighted,
}: Props) {
  if (loading && rows.length === 0) {
    return (
      <div className="app-card-flat p-8 text-center text-app-muted">
        Loading payment ledger…
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="app-card-flat p-10 text-center">
        <p className="text-app-text font-semibold">No payments found</p>
        <p className="text-sm text-app-muted mt-2">
          Try changing filters or wait for the first successful payment.
        </p>
      </div>
    );
  }

  return (
    <div className="payments-ledger app-card-flat overflow-hidden">
      <div className="payments-ledger__scroll">
        <table className="payments-ledger__table">
          <thead>
            <tr>
              <th>Paid / Created</th>
              <th>Event</th>
              <th>Investor</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Method</th>
              <th>Reference</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row._id}
                id={`payment-row-${row._id}`}
                className={clsx(isHighlighted?.(row) && "notif-row-highlight")}
              >
                <td>{formatWhen(row)}</td>
                <td>{row.event?.title || "—"}</td>
                <td>{row.investorName || "—"}</td>
                <td className="tabular-nums">{row.phone}</td>
                <td className="tabular-nums font-semibold">
                  {formatCurrency(row.amount)}
                  {Number(row.refundAmount || 0) > 0 && row.status === "success" && (
                    <span className="payments-ledger__net">
                      Net {formatCurrency(Math.max(0, row.amount - (row.refundAmount || 0)))}
                    </span>
                  )}
                </td>
                <td className="tabular-nums">{row.guestCount ?? 0}</td>
                <td>
                  <StatusBadge row={row} />
                </td>
                <td>{row.method || "—"}</td>
                <td className="font-mono text-xs text-app-muted">
                  {truncateId(row.razorpay_payment_id || row.razorpay_order_id)}
                </td>
                <td>
                  <div className="payments-row-actions">
                    {row.canRefund && onRefund && (
                      <button
                        type="button"
                        className="payments-row-action payments-row-action--refund"
                        onClick={() => onRefund(row)}
                        title="Issue refund"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="payments-row-action"
                      onClick={() => onView(row)}
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="payments-ledger__pagination">
        <button
          type="button"
          className="reg-toolbar-btn"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-app-muted">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="reg-toolbar-btn"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
