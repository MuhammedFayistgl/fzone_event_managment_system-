import { useState } from "react";
import { format } from "date-fns";
import type {
  PricingBreakdown,
  SuccessPaymentRecord,
  UserRefundStatus,
} from "../../utils/pricing";
import { formatCurrency } from "../../utils/pricing";
import PaymentSummaryBlock from "../pricing/PaymentSummaryBlock";

type PaymentSuccessProps = {
  paidTotal?: number;
  totalRefunded?: number;
  refundStatus?: UserRefundStatus;
  requiredTotal?: number;
  breakdown?: PricingBreakdown | null;
  successPayments?: SuccessPaymentRecord[];
  syncing?: boolean;
};

export const PaymentSuccess = ({
  paidTotal = 0,
  totalRefunded = 0,
  refundStatus = "none",
  requiredTotal = 0,
  breakdown = null,
  successPayments = [],
  syncing = false,
}: PaymentSuccessProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const hasPartialRefund = refundStatus === "partial" || refundStatus === "pending";
  const isFullRefund = refundStatus === "full";

  return (
    <div
      className={`app-card-raised p-5 border ${
        hasPartialRefund || isFullRefund
          ? "user-payment-success user-payment-success--refund bg-gradient-to-r from-amber-600/90 to-orange-600/90 border-amber-500/30"
          : "bg-gradient-to-r from-emerald-600/90 to-green-600/90 border-emerald-500/30"
      } text-app-text`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-app-surface text-emerald-500 flex items-center justify-center rounded-full font-bold text-lg shadow">
          {hasPartialRefund || isFullRefund ? "↺" : "✓"}
        </div>

        <div>
          <h2 className="text-lg font-bold">
            {hasPartialRefund
              ? "Payment received — partial refund issued"
              : isFullRefund
                ? "Payment refunded"
                : "Payment Successful"}
          </h2>
          <p className="text-sm opacity-90">
            {syncing
              ? "Confirming payment with server…"
              : hasPartialRefund
                ? "Your payment was received and a refund has been initiated via Razorpay."
                : isFullRefund
                  ? "Your payment has been fully refunded via Razorpay."
                  : "Your payment has been confirmed. You can complete registration below."}
          </p>
        </div>
      </div>

      {breakdown && requiredTotal > 0 && (
        <PaymentSummaryBlock
          breakdown={breakdown}
          paidTotal={paidTotal}
          totalRefunded={totalRefunded}
          requiredTotal={requiredTotal}
          variant="success"
          showTotalDue={false}
        />
      )}

      {successPayments.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="payment-history-toggle"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            {historyOpen ? "Hide" : "Show"} payment history ({successPayments.length})
          </button>
          {historyOpen && (
            <ul className="payment-history-list mt-2 space-y-1.5">
              {successPayments.map((p, i) => {
                const gross = Number(p.amount ?? 0);
                const refunded = Number(p.refundAmount ?? 0);
                const net = Number(p.netAmount ?? gross - refunded);
                return (
                  <li key={p.razorpay_order_id || i} className="payment-history-item">
                    <span>{formatCurrency(gross)}</span>
                    {refunded > 0 && (
                      <span className="opacity-80">
                        Refunded {formatCurrency(refunded)} · Net {formatCurrency(net)}
                      </span>
                    )}
                    <span className="opacity-80">
                      {p.guestCount != null ? `${p.guestCount} guest(s)` : "—"}
                    </span>
                    <span className="opacity-70 text-xs">
                      {p.paidAt
                        ? format(new Date(p.paidAt), "dd MMM yyyy · hh:mm a")
                        : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 text-xs opacity-80">
        Reference: Razorpay Verified • Secure Transaction
      </div>
    </div>
  );
};
