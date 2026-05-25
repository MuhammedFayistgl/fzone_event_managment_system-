import clsx from "clsx";
import { useNotificationStore } from "../store/notificationStore";

const CHIPS = [
  { id: "all", label: "All" },
  { id: "registration", label: "Registration" },
  { id: "payment", label: "Payment" },
  { id: "finance", label: "Finance" },
  { id: "security", label: "Security" },
  { id: "checkin", label: "Check-in" },
  { id: "event", label: "Event" },
  { id: "webhook", label: "Webhook" },
  { id: "system", label: "System" },
] as const;

type Props = {
  compact?: boolean;
};

export function NotificationCategoryChips({ compact }: Props) {
  const category = useNotificationStore((s) => s.filters.category);
  const setFilters = useNotificationStore((s) => s.setFilters);

  return (
    <div className={clsx("notif-filter-chips", compact && "notif-filter-chips--compact")}>
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={clsx(
            "reg-filter-chip",
            category === chip.id && "reg-filter-chip--active"
          )}
          onClick={() => setFilters({ category: chip.id })}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
