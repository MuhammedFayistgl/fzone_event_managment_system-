import clsx from "clsx";
import { useReconciliationStore } from "../../store/reconciliationStore";
import type { ReconciliationStatus } from "../../types/reconciliation.types";
import { formatReconciliationStatus } from "../../utils/formatReconciliation";

const CHIPS: Array<{ id: ReconciliationStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "matched", label: formatReconciliationStatus("matched") },
  { id: "pending", label: formatReconciliationStatus("pending") },
  { id: "mismatch", label: formatReconciliationStatus("mismatch") },
  { id: "failed", label: formatReconciliationStatus("failed") },
  { id: "refunded", label: formatReconciliationStatus("refunded") },
];

export function QuickFilterChips() {
  const active = useReconciliationStore((s) => s.activeQuickFilter);
  const setQuickFilter = useReconciliationStore((s) => s.setQuickFilter);

  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={clsx(
            "reg-filter-chip",
            active === chip.id && "reg-filter-chip--active"
          )}
          onClick={() => setQuickFilter(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
