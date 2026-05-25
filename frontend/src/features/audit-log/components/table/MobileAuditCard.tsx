import { Eye } from "lucide-react";
import type { AuditLogEntry } from "../../types/auditLog.types";
import { formatWhen, truncateId } from "../../utils/formatAuditLog";
import { CategoryBadge } from "./CategoryBadge";
import { SeverityBadge } from "./SeverityBadge";

type Props = {
  row: AuditLogEntry;
  onView: () => void;
};

export function MobileAuditCard({ row, onView }: Props) {
  return (
    <div className="audit-log-mobile-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-app-text">{row.actionLabel}</p>
          <p className="text-xs text-app-muted">{formatWhen(row.createdAt)}</p>
        </div>
        <CategoryBadge category={row.category} />
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-app-muted">{row.actorEmail || "system"}</span>
        <SeverityBadge severity={row.severity} />
      </div>
      <button type="button" className="reg-toolbar-btn w-full justify-center" onClick={onView}>
        <Eye size={14} />
        View details
      </button>
    </div>
  );
}

export function truncateTarget(row: AuditLogEntry) {
  if (!row.targetType && !row.targetId) return "—";
  return `${row.targetType || "target"} · ${truncateId(row.targetId)}`;
}
