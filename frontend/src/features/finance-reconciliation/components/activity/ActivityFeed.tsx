import type { ActivityItem } from "../../types/reconciliation.types";
import { ReconSkeleton } from "../ui/primitives";

type Props = {
  items?: ActivityItem[];
  loading?: boolean;
};

export function ActivityFeed({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <ReconSkeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return <p className="text-sm text-app-muted">No recent activity.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="finance-recon-activity-item">
          <div
            className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
              item.status === "error"
                ? "bg-red-500"
                : item.status === "success"
                  ? "bg-emerald-500"
                  : "bg-app-cyan"
            }`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-app-text">{item.title}</p>
            <p className="text-xs text-app-muted">{item.description}</p>
            <p className="text-xs text-app-muted mt-1">
              {new Date(item.at).toLocaleString()} · {item.source}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
