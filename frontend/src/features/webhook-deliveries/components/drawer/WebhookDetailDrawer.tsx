import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useWebhookDetail } from "../../hooks/useWebhookQueries";
import { ReconSheet } from "../../../finance-reconciliation/components/ui/ReconSheet";
import { WebhookErrorState, WebhookSkeleton } from "../ui/primitives";
import { EventTypeBadge } from "../table/EventTypeBadge";
import { StatusBadge } from "../table/StatusBadge";
import { formatWhen, truncateId } from "../../utils/formatWebhook";
import { buildPaymentDeepLink } from "../../../../utils/platformDeepLinks";

type Props = {
  deliveryId: string | null;
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

function resolvePaymentSearch(data: {
  entityId?: string;
  payloadSummary?: Record<string, unknown>;
}) {
  const summary = data.payloadSummary || {};
  const paymentId =
    (typeof summary.paymentId === "string" && summary.paymentId) ||
    (typeof summary.payment_id === "string" && summary.payment_id) ||
    "";
  const orderId =
    (typeof summary.orderId === "string" && summary.orderId) ||
    (typeof summary.order_id === "string" && summary.order_id) ||
    "";

  if (data.entityId?.startsWith("pay_") || data.entityId?.startsWith("rfnd_")) {
    return buildPaymentDeepLink({ paymentId: data.entityId, orderId });
  }

  return buildPaymentDeepLink({ paymentId, orderId, mongoId: paymentId || orderId });
}

export function WebhookDetailDrawer({ deliveryId, open, onClose }: Props) {
  const { data, isLoading, isError, refetch } = useWebhookDetail(deliveryId);
  const paymentLink = data ? resolvePaymentSearch(data) : null;

  return (
    <ReconSheet open={open} onClose={onClose} title="Webhook delivery details">
      {isLoading ? (
        <div className="space-y-3">
          <WebhookSkeleton className="h-6 w-40" />
          <WebhookSkeleton className="h-24 w-full" />
        </div>
      ) : isError || !data ? (
        <WebhookErrorState
          message="Could not load webhook delivery."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <EventTypeBadge label={data.eventTypeLabel} />
            <StatusBadge status={data.status} />
          </div>

          <div className="webhook-detail-hero space-y-2">
            <p className="text-lg font-semibold text-app-text">{data.eventType}</p>
            <p className="text-xs text-app-muted">{formatWhen(data.createdAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Provider" value={data.provider} />
            <Detail label="HTTP status" value={data.httpStatus != null ? String(data.httpStatus) : "—"} />
            <Detail label="Entity ID" value={data.entityId || "—"} />
            <Detail label="Processed at" value={formatWhen(data.processedAt)} />
          </div>

          {data.errorMessage && (
            <section>
              <h3 className="text-sm font-semibold mb-2 text-red-500">Error</h3>
              <p className="text-sm text-app-text break-words">{data.errorMessage}</p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold mb-2 text-app-text">Payload summary</h3>
            <pre className="webhook-code-block">
              {JSON.stringify(data.payloadSummary || {}, null, 2)}
            </pre>
          </section>

          {paymentLink && paymentLink !== "/payments" && (
            <div className="flex flex-wrap gap-2 border-t border-app-border pt-4">
              <Link to={paymentLink} className="reg-toolbar-btn inline-flex">
                <ExternalLink size={14} />
                Open payment record
              </Link>
            </div>
          )}

          {data.entityId && (
            <p className="text-xs text-app-muted font-mono">
              Entity: {truncateId(data.entityId, 40)}
            </p>
          )}
        </div>
      )}
    </ReconSheet>
  );
}
