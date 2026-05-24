import { Drawer } from "rsuite";
import { Link } from "react-router";
import { ExternalLink, RotateCcw } from "lucide-react";
import { formatCurrency } from "../../utils/pricing";
import type { PaymentLedgerRow, PaymentRefundEntry } from "../../Types/paymentLedger.types";

function RefundStatusBadge({ status }: { status?: PaymentRefundEntry["status"] }) {
  const normalized = status || "pending";
  const labels = {
    pending: "Pending",
    processed: "Processed",
    failed: "Failed",
  } as const;
  return (
    <span className={`payments-refund-status payments-refund-status--${normalized}`}>
      {labels[normalized] || "Pending"}
    </span>
  );
}

type Props = {
  open: boolean;
  row: PaymentLedgerRow | null;
  onClose: () => void;
  onRefund?: (row: PaymentLedgerRow) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="payments-detail-row">
      <span className="payments-detail-row__label">{label}</span>
      <span className="payments-detail-row__value">{value}</span>
    </div>
  );
}

function formatTs(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatReason(reason?: string | null) {
  if (!reason) return "—";
  return reason.replace(/_/g, " ");
}

function getRefundEligibilityMessage(row: PaymentLedgerRow) {
  if (row.status === "refunded") {
    return "This payment has been fully refunded.";
  }
  if (row.status !== "success") {
    return "Only successful payments can be refunded.";
  }
  if (!row.razorpay_payment_id) {
    return "Razorpay payment ID is missing — refund unavailable.";
  }
  if (!row.isRefundable) {
    return "This event is not marked as refundable in event settings.";
  }
  if ((row.refundableRemaining ?? 0) <= 0) {
    return "No refundable balance remaining.";
  }
  return null;
}

export default function PaymentDetailDrawer({
  open,
  row,
  onClose,
  onRefund,
}: Props) {
  if (!row) {
    return null;
  }

  const breakdown = row.breakdown;
  const eventId = row.event?._id || row.eventId;
  const refunded = Number(row.refundAmount || 0);
  const netAmount = Math.max(0, Number(row.amount || 0) - refunded);
  const eligibilityMessage = getRefundEligibilityMessage(row);
  const canRefund = row.canRefund && !eligibilityMessage;

  return (
    <Drawer open={open} onClose={onClose} size="sm" className="payments-detail-drawer">
      <Drawer.Header>
        <Drawer.Title>Payment details</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body className="space-y-4">
        <div className="payments-detail-hero">
          <p className="payments-detail-hero__amount">
            {formatCurrency(row.amount)}
          </p>
          {refunded > 0 && (
            <p className="payments-detail-hero__net">
              Net collected: {formatCurrency(netAmount)} · Refunded:{" "}
              {formatCurrency(refunded)}
            </p>
          )}
          <p className="payments-detail-hero__meta">
            {row.investorName || "Unknown investor"} · {row.phone}
          </p>
        </div>

        {eligibilityMessage && row.status === "success" && (
          <div className="payments-refund-banner payments-refund-banner--info">
            {eligibilityMessage}
          </div>
        )}

        <DetailRow label="Event" value={row.event?.title || "—"} />
        <DetailRow label="Status" value={row.status} />
        <DetailRow label="Method" value={row.method || "—"} />
        <DetailRow label="Guest count" value={String(row.guestCount ?? 0)} />
        {row.refundableRemaining != null && row.status === "success" && (
          <DetailRow
            label="Refundable remaining"
            value={formatCurrency(row.refundableRemaining)}
          />
        )}

        {breakdown && (
          <div className="payments-detail-block">
            <p className="payments-detail-block__title">Amount breakdown</p>
            <DetailRow
              label="Investor amount"
              value={formatCurrency(breakdown.investorAmount ?? 0)}
            />
            <DetailRow
              label="Guest amount"
              value={formatCurrency(breakdown.guestAmount ?? 0)}
            />
            <DetailRow
              label="Payable guests"
              value={String(breakdown.payableGuestCount ?? 0)}
            />
            <DetailRow label="Free guests" value={String(breakdown.freeGuestCount ?? 0)} />
          </div>
        )}

        <div className="payments-detail-block">
          <p className="payments-detail-block__title">Razorpay references</p>
          <DetailRow label="Order ID" value={row.razorpay_order_id} />
          <DetailRow label="Payment ID" value={row.razorpay_payment_id || "—"} />
        </div>

        {(row.refunds?.length ?? 0) > 0 && (
          <div className="payments-detail-block">
            <p className="payments-detail-block__title">Refund history</p>
            <ul className="payments-refund-history">
              {row.refunds!.map((entry) => (
                <li key={entry.refundId} className="payments-refund-history__item">
                  <div>
                    <div className="payments-refund-history__head">
                      <p className="payments-refund-history__amount">
                        {formatCurrency(entry.amount)}
                      </p>
                      <RefundStatusBadge status={entry.status} />
                    </div>
                    <p className="payments-refund-history__meta">
                      {formatReason(entry.reason)} ·{" "}
                      {formatTs(entry.processedAt || entry.refundedAt || entry.initiatedAt)}
                    </p>
                    {entry.razorpayReceipt ? (
                      <p className="payments-refund-history__receipt">
                        Receipt: {entry.razorpayReceipt}
                      </p>
                    ) : null}
                    {entry.failureReason ? (
                      <p className="payments-refund-history__failed">{entry.failureReason}</p>
                    ) : null}
                    {entry.note ? (
                      <p className="payments-refund-history__note">{entry.note}</p>
                    ) : null}
                  </div>
                  <span className="payments-refund-history__id">{entry.refundId}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="payments-detail-block">
          <p className="payments-detail-block__title">Timeline</p>
          <DetailRow label="Created" value={formatTs(row.createdAt)} />
          <DetailRow label="Paid" value={formatTs(row.paidAt)} />
          <DetailRow label="Failed" value={formatTs(row.failedAt)} />
          <DetailRow label="Refunded" value={formatTs(row.refundedAt)} />
          {row.refundReason && (
            <DetailRow label="Latest reason" value={formatReason(row.refundReason)} />
          )}
        </div>

        {eventId && (
          <Link
            to={`/event-attendance/${eventId}`}
            className="payments-detail-link"
            onClick={onClose}
          >
            View in Attendance
            <ExternalLink size={15} />
          </Link>
        )}
      </Drawer.Body>

      {canRefund && onRefund && (
        <Drawer.Footer className="payments-detail-footer">
          <button
            type="button"
            className="payments-refund-submit"
            onClick={() => onRefund(row)}
          >
            <RotateCcw size={16} />
            Issue refund
          </button>
        </Drawer.Footer>
      )}
    </Drawer>
  );
}
