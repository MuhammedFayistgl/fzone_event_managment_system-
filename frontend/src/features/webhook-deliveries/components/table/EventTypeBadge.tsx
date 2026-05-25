import { WebhookBadge } from "../ui/primitives";

export function EventTypeBadge({ label }: { label: string }) {
  return <WebhookBadge className="webhook-badge--event">{label}</WebhookBadge>;
}
