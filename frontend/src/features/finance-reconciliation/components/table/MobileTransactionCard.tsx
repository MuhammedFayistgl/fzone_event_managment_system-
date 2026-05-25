import { Eye } from "lucide-react";
import type { ReconciliationTransaction } from "../../types/reconciliation.types";
import { formatAmount } from "../../utils/formatReconciliation";
import { StatusBadge } from "./StatusBadge";
import { ReconButton } from "../ui/primitives";

type Props = {
  row: ReconciliationTransaction;
  onView: () => void;
};

export function MobileTransactionCard({ row, onView }: Props) {
  return (
    <div className="finance-recon-mobile-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-app-text">{row.investorName || row.phone}</p>
          <p className="text-xs text-app-muted">
            {row.razorpay_payment_id || row.razorpay_order_id}
          </p>
        </div>
        <StatusBadge status={row.reconciliationStatus} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{formatAmount(row.amount)}</span>
        <span className="text-app-muted capitalize">{row.settlementStatus}</span>
      </div>
      <ReconButton variant="ghost" className="w-full justify-center" onClick={onView}>
        <Eye size={14} />
        View details
      </ReconButton>
    </div>
  );
}
