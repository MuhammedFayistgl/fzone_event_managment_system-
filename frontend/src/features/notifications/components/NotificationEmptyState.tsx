import { Bell } from "lucide-react";

export function NotificationEmptyState({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "notif-panel__empty" : "notif-center-empty"}>
      <Bell size={compact ? 28 : 36} className="mx-auto opacity-40 mb-2" />
      <p className="font-medium text-app-text">You're all caught up</p>
      <p className="text-sm text-app-muted mt-1">
        New alerts will appear here instantly when something happens.
      </p>
    </div>
  );
}
