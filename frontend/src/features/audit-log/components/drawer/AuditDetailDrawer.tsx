import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useAuditLogDetail } from "../../hooks/useAuditLogQueries";
import { ReconSheet } from "../../../finance-reconciliation/components/ui/ReconSheet";
import { AuditErrorState, AuditSkeleton } from "../ui/primitives";
import { CategoryBadge } from "../table/CategoryBadge";
import { SeverityBadge } from "../table/SeverityBadge";
import { formatWhen } from "../../utils/formatAuditLog";
import {
  buildEventDeepLink,
  buildPaymentDeepLink,
  buildRegistrationDeepLink,
} from "../../../../utils/platformDeepLinks";

type Props = {
  entryId: string | null;
  open: boolean;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-app-muted">{label}</p>
      <p className="font-medium break-all text-app-text">{value}</p>
    </div>
  );
}

export function AuditDetailDrawer({ entryId, open, onClose }: Props) {
  const { data, isLoading, isError, refetch } = useAuditLogDetail(entryId);

  const paymentLink =
    data?.targetType === "payment"
      ? buildPaymentDeepLink({ mongoId: data.targetId })
      : null;
  const registrationLink =
    data?.targetType === "registration"
      ? buildRegistrationDeepLink({ targetId: data.targetId, phone: data.phone })
      : null;
  const eventLink = data?.eventId ? buildEventDeepLink(data.eventId) : null;

  return (
    <ReconSheet open={open} onClose={onClose} title="Audit entry details">
      {isLoading ? (
        <div className="space-y-3">
          <AuditSkeleton className="h-6 w-40" />
          <AuditSkeleton className="h-24 w-full" />
        </div>
      ) : isError || !data ? (
        <AuditErrorState
          message="Could not load audit entry."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CategoryBadge category={data.category} />
            <SeverityBadge severity={data.severity} />
          </div>

          <div className="audit-log-detail-hero space-y-2">
            <p className="text-lg font-semibold text-app-text">{data.actionLabel}</p>
            <p className="text-sm text-app-muted">{data.action}</p>
            <p className="text-xs text-app-muted">{formatWhen(data.createdAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Actor" value={data.actorEmail || "system"} />
            <Detail label="Role" value={data.actorRole || "—"} />
            <Detail label="IP address" value={data.ip || "—"} />
            <Detail label="Phone" value={data.phone || "—"} />
            <Detail label="Event" value={data.eventTitle || "—"} />
            <Detail label="Target type" value={data.targetType || "—"} />
            <Detail label="Target ID" value={data.targetId || "—"} />
          </div>

          {data.category === "export" && data.metadata?.count != null && (
            <p className="text-sm text-app-muted">
              Exported {String(data.metadata.count)} record(s)
            </p>
          )}

          <section>
            <h3 className="text-sm font-semibold mb-2 text-app-text">Metadata</h3>
            <pre className="audit-log-code-block">
              {JSON.stringify(data.metadata || {}, null, 2)}
            </pre>
          </section>

          <div className="flex flex-wrap gap-2 border-t border-app-border pt-4">
            {paymentLink && (
              <Link to={paymentLink} className="reg-toolbar-btn inline-flex">
                <ExternalLink size={14} />
                Open payment record
              </Link>
            )}
            {registrationLink && (
              <Link to={registrationLink} className="reg-toolbar-btn inline-flex">
                <ExternalLink size={14} />
                Open registration
              </Link>
            )}
            {eventLink && (
              <Link to={eventLink} className="reg-toolbar-btn inline-flex">
                <ExternalLink size={14} />
                Open event
              </Link>
            )}
          </div>
        </div>
      )}
    </ReconSheet>
  );
}
