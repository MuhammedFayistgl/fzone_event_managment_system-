import { useEffect, useMemo, useState } from "react";
import { Modal, Input, SelectPicker } from "rsuite";
import { AlertTriangle, RotateCcw } from "lucide-react";
import API from "../../api/axios";
import { formatCurrency } from "../../utils/pricing";
import type {
  PaymentLedgerRow,
  RefundAccessImpact,
  RefundReason,
} from "../../Types/paymentLedger.types";

const REASON_OPTIONS: { label: string; value: RefundReason }[] = [
  { label: "Duplicate payment", value: "duplicate_payment" },
  { label: "Event cancelled", value: "event_cancelled" },
  { label: "Customer request", value: "customer_request" },
  { label: "Other", value: "other" },
];

type Props = {
  open: boolean;
  row: PaymentLedgerRow | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    amount: number;
    reason: RefundReason;
    note: string;
    revokeAccess: boolean;
  }) => void;
};

function formatPaymentMethod(method?: string | null) {
  if (!method) return "original payment method";
  return method.toUpperCase();
}

export default function PaymentRefundModal({
  open,
  row,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const maxAmount = row?.refundableRemaining ?? 0;
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<RefundReason | null>(null);
  const [note, setNote] = useState("");
  const [revokeAccess, setRevokeAccess] = useState(true);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [accessPreview, setAccessPreview] = useState<RefundAccessImpact | null>(
    null
  );
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setAmount(String(row.refundableRemaining ?? row.amount ?? ""));
    setReason(null);
    setNote("");
    setRevokeAccess(true);
    setStep("form");
    setAccessPreview(null);
    setPreviewLoading(false);
  }, [open, row]);

  const parsedAmount = Number(amount);
  const isValidAmount =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= maxAmount + 0.001;

  const canProceed = isValidAmount && reason != null;

  const setQuickAmount = (fraction: number) => {
    const next =
      fraction >= 1
        ? maxAmount
        : Math.max(0, Math.round(maxAmount * fraction * 100) / 100);
    setAmount(String(next));
  };

  useEffect(() => {
    if (step !== "confirm" || !row || !revokeAccess || !isValidAmount) {
      setAccessPreview(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    API.post(`/admin/payments/${row._id}/refund-preview`, {
      amount: parsedAmount,
    })
      .then((res) => {
        if (cancelled) return;
        setAccessPreview(res.data?.data || null);
      })
      .catch(() => {
        if (cancelled) return;
        setAccessPreview(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, row, revokeAccess, isValidAmount, parsedAmount]);

  const accessImpactMessage = useMemo(() => {
    if (!revokeAccess) {
      return "Entry access will not be adjusted for this refund.";
    }
    if (previewLoading) return "Calculating access impact…";
    return (
      accessPreview?.message ||
      "Entry access will be adjusted based on the remaining balance after refund."
    );
  }, [accessPreview?.message, previewLoading, revokeAccess]);

  const handlePrimary = () => {
    if (step === "form") {
      if (!canProceed) return;
      setStep("confirm");
      return;
    }

    if (!reason || !row) return;
    onConfirm({
      amount: parsedAmount,
      reason,
      note: note.trim(),
      revokeAccess,
    });
  };

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      className="payments-refund-modal"
    >
      <Modal.Header>
        <Modal.Title className="flex items-center gap-2">
          <RotateCcw size={18} />
          Issue refund
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        {step === "form" ? (
          <>
            <div className="payments-refund-summary">
              <p className="payments-refund-summary__title">
                {row.investorName || "Unknown investor"}
              </p>
              <p className="payments-refund-summary__meta">
                {row.event?.title || "Event"} · {row.phone}
              </p>
              <p className="payments-refund-summary__amount">
                Refundable: {formatCurrency(maxAmount)}
              </p>
            </div>

            <div className="payments-refund-field">
              <label htmlFor="refund-amount">Refund amount</label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                max={maxAmount}
                step={0.01}
                value={amount}
                onChange={setAmount}
                disabled={loading}
              />
              <div className="payments-refund-quick">
                <button type="button" onClick={() => setQuickAmount(0.25)}>
                  25%
                </button>
                <button type="button" onClick={() => setQuickAmount(0.5)}>
                  50%
                </button>
                <button type="button" onClick={() => setQuickAmount(1)}>
                  Full
                </button>
              </div>
            </div>

            <div className="payments-refund-field">
              <label>Reason</label>
              <SelectPicker
                block
                searchable={false}
                cleanable={false}
                popupClassName="pro-picker-menu"
                className="pro-picker-toggle"
                placeholder="Select reason"
                data={REASON_OPTIONS}
                value={reason}
                onChange={(value) => setReason(value as RefundReason | null)}
                disabled={loading}
              />
            </div>

            <div className="payments-refund-field">
              <label htmlFor="refund-note">Note (optional)</label>
              <Input
                id="refund-note"
                as="textarea"
                rows={3}
                value={note}
                onChange={setNote}
                disabled={loading}
                placeholder="Internal note for audit trail"
              />
            </div>

            <label className="payments-refund-checkbox">
              <input
                type="checkbox"
                checked={revokeAccess}
                onChange={(e) => setRevokeAccess(e.target.checked)}
                disabled={loading}
              />
              <span>
                Adjust entry access based on remaining balance after refund
              </span>
            </label>
          </>
        ) : (
          <div className="payments-refund-confirm">
            <div className="payments-refund-confirm__icon" aria-hidden>
              <AlertTriangle size={22} />
            </div>
            <p className="payments-refund-confirm__title">Confirm refund</p>
            <p className="payments-refund-confirm__text">
              You are about to refund{" "}
              <strong>{formatCurrency(parsedAmount)}</strong> to{" "}
              <strong>{row.investorName || row.phone}</strong> for{" "}
              <strong>{row.event?.title || "this event"}</strong>.
            </p>
            <p className="payments-refund-confirm__razorpay">
              Amount will be refunded via <strong>Razorpay</strong> to the
              customer&apos;s original payment method
              {row.method ? ` (${formatPaymentMethod(row.method)})` : ""}.
            </p>
            <p className="payments-refund-confirm__note">
              UPI and card refunds are processed by Razorpay. Some methods may
              take 5–7 business days to reflect in the customer account.
            </p>
            {revokeAccess && (
              <p className="payments-refund-confirm__warn">{accessImpactMessage}</p>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button
          type="button"
          className="reg-toolbar-btn"
          onClick={step === "confirm" ? () => setStep("form") : onClose}
          disabled={loading}
        >
          {step === "confirm" ? "Back" : "Cancel"}
        </button>
        <button
          type="button"
          className="payments-refund-submit"
          onClick={handlePrimary}
          disabled={loading || (step === "form" && !canProceed)}
        >
          {loading
            ? "Processing…"
            : step === "confirm"
              ? "Confirm refund"
              : "Review refund"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
