import type { TimelineEvent } from "../../types/reconciliation.types";

type Props = {
  events: TimelineEvent[];
};

export function PaymentTimeline({ events }: Props) {
  if (!events.length) {
    return <p className="text-sm text-app-muted">No timeline events.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((event) => (
        <div key={event.id} className="finance-recon-timeline-item">
          <div className="finance-recon-timeline-dot" />
          <p className="text-sm font-medium">{event.title}</p>
          <p className="text-xs text-app-muted mt-0.5">
            {new Date(event.at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
