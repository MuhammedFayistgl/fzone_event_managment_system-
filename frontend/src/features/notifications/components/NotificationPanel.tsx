import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useArchiveNotificationMutation,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsInfinite,
} from "../hooks/useNotificationQueries";
import { NotificationItem } from "./NotificationItem";
import { NotificationCategoryChips } from "./NotificationCategoryChips";
import { NotificationEmptyState } from "./NotificationEmptyState";
import { groupNotifications } from "../utils/notificationFormat";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NotificationPanel({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotificationsInfinite(open);
  const markRead = useMarkReadMutation();
  const markAllRead = useMarkAllReadMutation();
  const archive = useArchiveNotificationMutation();

  const rows = useMemo(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data]
  );
  const groups = useMemo(() => groupNotifications(rows), [rows]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          className="notif-panel"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
        >
          <div className="notif-panel__header">
            <div>
              <p className="notif-panel__title">Notifications</p>
              <p className="notif-panel__subtitle">Real-time alerts across your workspace</p>
            </div>
            <button
              type="button"
              className="notif-panel__mark-all"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          </div>

          <div className="notif-panel__filters">
            <NotificationCategoryChips compact />
          </div>

          <div className="notif-panel__body">
            {isLoading && (
              <div className="notif-panel__empty">
                <Loader2 className="animate-spin mx-auto" size={20} />
              </div>
            )}

            {!isLoading && !rows.length && <NotificationEmptyState compact />}

            {Object.entries(groups).map(([label, items]) => (
              <section key={label} className="notif-panel__group">
                <h3 className="notif-panel__group-label">{label}</h3>
                {items.map((item) => (
                  <NotificationItem
                    key={item._id}
                    item={item}
                    compact
                    onRead={(id) => markRead.mutate(id)}
                    onArchive={(id) => archive.mutate(id)}
                    onNavigate={onClose}
                  />
                ))}
              </section>
            ))}

            {hasNextPage && (
              <button
                type="button"
                className="notif-panel__load-more"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            )}
          </div>

          <div className="notif-panel__footer">
            <Link to="/notifications" className="notif-panel__view-all" onClick={onClose}>
              View notification center
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
