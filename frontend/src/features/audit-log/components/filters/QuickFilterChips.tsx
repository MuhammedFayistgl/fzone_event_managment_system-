import clsx from "clsx";
import { useAuditLogStore } from "../../store/auditLogStore";
import type { AuditCategory } from "../../types/auditLog.types";
import { formatCategoryLabel } from "../../utils/formatAuditLog";

const CHIPS: Array<{ id: AuditCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "refund", label: formatCategoryLabel("refund") },
  { id: "block", label: formatCategoryLabel("block") },
  { id: "export", label: formatCategoryLabel("export") },
  { id: "payment", label: formatCategoryLabel("payment") },
  { id: "settings", label: formatCategoryLabel("settings") },
  { id: "webhook", label: formatCategoryLabel("webhook") },
];

export function QuickFilterChips() {
  const active = useAuditLogStore((s) => s.activeQuickFilter);
  const setQuickFilter = useAuditLogStore((s) => s.setQuickFilter);

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
