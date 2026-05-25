import type { WebhookDelivery } from "../../types/webhook.types";
import { formatWhen, truncateError, truncateId } from "../../utils/formatWebhook";
import { EventTypeBadge } from "./EventTypeBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  row: WebhookDelivery;
  onView: () => void;
};

export function MobileWebhookCard({ row, onView }: Props) {
  return (
    <button type="button" className="webhook-mobile-card w-full text-left" onClick={onView}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <EventTypeBadge label={row.eventTypeLabel} />
        <StatusBadge status={row.status} />
      </div>
      <p className="text-xs text-app-muted mb-1">{formatWhen(row.createdAt)}</p>
      <p className="text-sm font-mono text-app-text">{truncateId(row.entityId)}</p>
      {row.errorMessage && (
        <p className="text-xs text-red-500 mt-2">{truncateError(row.errorMessage, 80)}</p>
      )}
    </button>
  );
}
