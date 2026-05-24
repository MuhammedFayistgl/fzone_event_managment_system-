import { RotateCcw } from "lucide-react";
import { formatCurrency } from "../../utils/pricing";
import type { UserRefundStatus } from "../../utils/pricing";

type Props = {
  refundStatus: UserRefundStatus;
  totalRefunded?: number;
  paidTotal?: number;
  grossPaidTotal?: number;
};

export default function UserRefundStatusBanner({
  refundStatus,
  totalRefunded = 0,
  paidTotal = 0,
  grossPaidTotal = 0,
}: Props) {
  if (refundStatus === "none" || totalRefunded <= 0) {
    return null;
  }

  const remaining = Math.max(0, paidTotal);

  let title = "Refund update";
  let message = "";

  if (refundStatus === "full") {
    title = "Full refund issued";
    message = `A full refund of ${formatCurrency(totalRefunded)} has been sent via Razorpay to your original payment method. Credit may take 1–7 business days.`;
  } else if (refundStatus === "pending") {
    title = "Refund processing";
    message = `A refund of ${formatCurrency(totalRefunded)} is being processed via Razorpay to your original payment method.`;
  } else {
    title = "Partial refund issued";
    message = `${formatCurrency(totalRefunded)} refunded via Razorpay${
      grossPaidTotal > totalRefunded
        ? `. ${formatCurrency(remaining)} remains as your net paid balance for this event.`
        : "."
    }`;
  }

  return (
    <div className={`user-refund-banner user-refund-banner--${refundStatus}`}>
      <div className="user-refund-banner__icon" aria-hidden>
        <RotateCcw size={18} />
      </div>
      <div>
        <p className="user-refund-banner__title">{title}</p>
        <p className="user-refund-banner__text">{message}</p>
        <p className="user-refund-banner__note">
          Check your UPI app or bank statement for the credit.
        </p>
      </div>
    </div>
  );
}
