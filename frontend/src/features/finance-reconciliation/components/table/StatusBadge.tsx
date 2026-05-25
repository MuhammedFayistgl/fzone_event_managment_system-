import { ReconBadge } from "../ui/primitives";
import type { ReconciliationStatus } from "../../types/reconciliation.types";
import {
  formatReconciliationStatus,
  statusBadgeClass,
} from "../../utils/formatReconciliation";

export function StatusBadge({ status }: { status: ReconciliationStatus }) {
  return (
    <ReconBadge className={statusBadgeClass(status)}>
      {formatReconciliationStatus(status)}
    </ReconBadge>
  );
}
