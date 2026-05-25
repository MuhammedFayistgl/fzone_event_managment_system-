import { WebhookBadge } from "../ui/primitives";
import { formatStatusLabel, statusBadgeClass } from "../../utils/formatWebhook";

export function StatusBadge({ status }: { status: string }) {
  return (
    <WebhookBadge className={statusBadgeClass(status)}>
      {formatStatusLabel(status)}
    </WebhookBadge>
  );
}
