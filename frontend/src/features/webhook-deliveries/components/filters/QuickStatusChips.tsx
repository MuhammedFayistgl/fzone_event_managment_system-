import clsx from "clsx";
import { useWebhookStore } from "../../store/webhookStore";
import type { WebhookStatus } from "../../types/webhook.types";
import { formatStatusLabel } from "../../utils/formatWebhook";

const CHIPS: Array<{ id: WebhookStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "processed", label: formatStatusLabel("processed") },
  { id: "failed", label: formatStatusLabel("failed") },
  { id: "ignored", label: formatStatusLabel("ignored") },
  { id: "received", label: formatStatusLabel("received") },
];

export function QuickStatusChips() {
  const active = useWebhookStore((s) => s.activeQuickFilter);
  const setQuickFilter = useWebhookStore((s) => s.setQuickFilter);

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
