import type { EventPricingFields, PricingBreakdown } from "../../utils/pricing";
import { formatCurrency } from "../../utils/pricing";

type Props = {
  breakdown: PricingBreakdown | null;
  event?: EventPricingFields | null;
  paidTotal?: number;
  totalRefunded?: number;
  requiredTotal?: number;
  variant?: "default" | "compact" | "success";
  showTotalDue?: boolean;
  className?: string;
};

export default function PaymentSummaryBlock({
  breakdown,
  event,
  paidTotal = 0,
  totalRefunded = 0,
  requiredTotal = 0,
  variant = "default",
  showTotalDue = true,
  className = "",
}: Props) {
  if (!breakdown || requiredTotal <= 0) return null;

  const amountDue = Math.max(0, requiredTotal - paidTotal);
  const isCompact = variant === "compact";
  const isSuccess = variant === "success";

  return (
    <div
      className={`payment-summary-block payment-summary-block--${variant} ${className}`.trim()}
    >
      {!isCompact && !isSuccess && (
        <p className="payment-summary-block__title text-sm font-semibold text-app-text mb-2">
          Payment summary
        </p>
      )}

      <div className={`space-y-2 ${isCompact ? "text-xs" : "text-sm"}`}>
        {!breakdown.investorIsFree && breakdown.investorAmount > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-app-secondary">Investor entry</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(breakdown.investorAmount)}
            </span>
          </div>
        )}

        {breakdown.guestPaymentEnabled && (
          <>
            <div className="flex justify-between gap-3">
              <span className="text-app-secondary">
                Guests ({breakdown.guestCount}
                {breakdown.freeGuestCount
                  ? `, first ${breakdown.freeGuestCount} free`
                  : ""}
                )
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(breakdown.guestAmount)}
              </span>
            </div>
            {breakdown.payableGuestCount > 0 && (
              <p className="text-xs text-app-muted">
                {breakdown.payableGuestCount} payable guest(s) ×{" "}
                {formatCurrency(event?.guestPrice ?? 0)}
              </p>
            )}
          </>
        )}

        {totalRefunded > 0 && (
          <div className="flex justify-between gap-3 text-amber-500">
            <span>Refunded</span>
            <span className="font-semibold tabular-nums">
              - {formatCurrency(totalRefunded)}
            </span>
          </div>
        )}

        {paidTotal > 0 && !isSuccess && (
          <div className="flex justify-between gap-3 text-emerald-500">
            <span>Already paid</span>
            <span className="font-semibold tabular-nums">
              - {formatCurrency(paidTotal)}
            </span>
          </div>
        )}

        {isSuccess && paidTotal > 0 && (
          <div className="flex justify-between gap-3">
            <span>Amount paid</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(paidTotal)}
            </span>
          </div>
        )}

        {showTotalDue && !isSuccess && (
          <div className="flex justify-between items-center pt-2 border-t border-app-border font-bold">
            <span>Amount due</span>
            <span className="text-red-500 tabular-nums">
              {formatCurrency(amountDue)}
            </span>
          </div>
        )}

        {isSuccess && requiredTotal > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-white/20 font-bold opacity-95">
            <span>Total covered</span>
            <span className="tabular-nums">{formatCurrency(requiredTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
