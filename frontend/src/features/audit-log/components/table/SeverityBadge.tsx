import { AuditBadge } from "../ui/primitives";
import { severityBadgeClass } from "../../utils/formatAuditLog";
import type { AuditSeverity } from "../../types/auditLog.types";

export function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  return (
    <AuditBadge className={severityBadgeClass(severity)}>
      {severity}
    </AuditBadge>
  );
}
