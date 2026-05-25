import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useRecentAlertsQuery } from "../hooks/useNotificationQueries";
import { PriorityBadge } from "./PriorityBadge";
import { formatRelativeTime } from "../utils/notificationFormat";
import { resolveNotificationHref } from "../../../utils/notificationRoutes";
import { useMarkReadMutation } from "../hooks/useNotificationQueries";

export function RecentAlertsWidget() {
  const { data, isLoading, isError } = useRecentAlertsQuery();
  const markRead = useMarkReadMutation();
  const rows = data ?? [];

  return (
    <section className="notif-alerts-widget">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-400" />
          <h3 className="font-semibold text-app-text">Recent alerts</h3>
        </div>
        <Link to="/notifications" className="text-xs text-app-accent hover:opacity-80">
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="py-6 text-center text-app-muted">
          <Loader2 className="animate-spin mx-auto" size={18} />
        </div>
      )}

      {isError && (
        <p className="text-sm text-app-muted py-4">Could not load alerts.</p>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="text-sm text-app-muted py-2">No critical alerts right now.</p>
      )}

      <ul className="space-y-2">
        {rows.map((item) => (
          <li key={item._id}>
            <Link
              to={resolveNotificationHref(item)}
              className="block rounded-xl border border-app-border p-3 hover:bg-[var(--color-card-hover)] transition"
              onClick={() => {
                if (!item.read) markRead.mutate(item._id);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">{item.title}</p>
                  <p className="text-xs text-app-muted mt-0.5 line-clamp-2">{item.message}</p>
                </div>
                <PriorityBadge priority={item.priority} />
              </div>
              <p className="text-[0.65rem] text-app-muted mt-2 flex items-center gap-1">
                {formatRelativeTime(item.createdAt)}
                <ArrowRight size={12} />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
