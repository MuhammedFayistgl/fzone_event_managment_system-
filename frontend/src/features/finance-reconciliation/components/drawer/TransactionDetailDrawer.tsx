import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveSchema, type ResolveFormValues } from "../../types/schemas";
import {
  useReconciliationDetail,
  useResolveTransaction,
} from "../../hooks/useReconciliationQueries";
import { ReconSheet } from "../ui/ReconSheet";
import { ReconButton, ReconErrorState, ReconInput, ReconSkeleton } from "../ui/primitives";
import { PaymentTimeline } from "./PaymentTimeline";
import { StatusBadge } from "../table/StatusBadge";
import { formatAmount } from "../../utils/formatReconciliation";
import { getRoleFromToken } from "../../../../utils/authRole";
import { buildPaymentDeepLink } from "../../../../utils/platformDeepLinks";

type Props = {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
};

export function TransactionDetailDrawer({ transactionId, open, onClose }: Props) {
  const { data, isLoading, isError, refetch } = useReconciliationDetail(transactionId);
  const resolveMutation = useResolveTransaction();
  const role = getRoleFromToken();
  const canResolve = role === "admin" || role === "finance";

  const { register, handleSubmit, reset } = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { note: "" },
  });

  const tx = data?.transaction;
  const paymentLink = tx
    ? buildPaymentDeepLink({
        paymentId: tx.razorpay_payment_id,
        orderId: tx.razorpay_order_id,
        mongoId: tx._id,
      })
    : "/payments";

  const onResolve = handleSubmit(async (values) => {
    if (!transactionId) return;
    try {
      await resolveMutation.mutateAsync({ id: transactionId, note: values.note });
      toast.success("Transaction marked as reconciled");
      reset();
      refetch();
    } catch {
      toast.error("Could not resolve transaction");
    }
  });

  return (
    <ReconSheet open={open} onClose={onClose} title="Transaction details">
      {isLoading ? (
        <div className="space-y-3">
          <ReconSkeleton className="h-6 w-40" />
          <ReconSkeleton className="h-24 w-full" />
        </div>
      ) : isError || !tx ? (
        <ReconErrorState
          message="Could not load transaction details."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={tx.reconciliationStatus} />
            <span className="text-xs text-app-muted capitalize">
              {tx.settlementStatus} settlement
            </span>
          </div>

          <div className="finance-recon-detail-hero grid grid-cols-2 gap-3 text-sm">
            <Detail label="Customer" value={tx.investorName || "—"} />
            <Detail label="Phone" value={tx.phone} />
            <Detail label="Amount" value={formatAmount(tx.amount)} />
            <Detail label="Net ledger" value={formatAmount(tx.ledgerNet)} />
            <Detail
              label="Gateway amount"
              value={
                tx.gatewayAmount != null ? formatAmount(tx.gatewayAmount) : "N/A"
              }
            />
            <Detail
              label="Variance"
              value={formatAmount(tx.variance)}
              highlight={Math.abs(tx.variance) > 0.01}
            />
            <Detail label="Order ID" value={tx.razorpay_order_id} />
            <Detail label="Payment ID" value={tx.razorpay_payment_id || "—"} />
          </div>

          {tx.reconciliationReviewedAt && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Reviewed {new Date(tx.reconciliationReviewedAt).toLocaleString()}
            </p>
          )}

          <section>
            <h3 className="text-sm font-semibold mb-3 text-app-text">Activity timeline</h3>
            <PaymentTimeline events={data.timeline} />
          </section>

          {data.gatewayResponse && (
            <section>
              <h3 className="text-sm font-semibold mb-2 text-app-text">Gateway response</h3>
              <pre className="finance-recon-code-block">
                {JSON.stringify(data.gatewayResponse, null, 2)}
              </pre>
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t border-app-border pt-4">
            <Link to={paymentLink} className="reg-toolbar-btn inline-flex">
              <ExternalLink size={14} />
              Open payment record
            </Link>
          </div>

          {canResolve && (
            <form onSubmit={onResolve} className="space-y-3 border-t border-app-border pt-4">
              <ReconInput
                {...register("note")}
                placeholder="Reconciliation note (optional)"
              />
              <ReconButton
                variant="primary"
                type="submit"
                disabled={resolveMutation.isPending}
              >
                <CheckCircle size={14} />
                Mark reconciled
              </ReconButton>
            </form>
          )}
        </div>
      )}
    </ReconSheet>
  );
}

function Detail({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-app-muted">{label}</p>
      <p
        className={`font-medium break-all text-app-text ${
          highlight ? "text-orange-500 dark:text-orange-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
