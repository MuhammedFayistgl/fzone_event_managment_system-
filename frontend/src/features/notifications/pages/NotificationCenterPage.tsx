import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import AppPageLayout from "../../../layouts/AppPageLayout";
import {
  useArchiveNotificationMutation,
  useDeleteNotificationMutation,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsInfinite,
} from "../hooks/useNotificationQueries";
import { NotificationItem } from "../components/NotificationItem";
import { NotificationPhase2Stub } from "../components/NotificationPhase2Stub";
import { NotificationFilters } from "../components/NotificationFilters";
import { NotificationEmptyState } from "../components/NotificationEmptyState";
import { groupNotifications } from "../utils/notificationFormat";
import "../notifications.css";

export default function NotificationCenterPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useNotificationsInfinite(true);
  const markRead = useMarkReadMutation();
  const markAllRead = useMarkAllReadMutation();
  const archive = useArchiveNotificationMutation();
  const remove = useDeleteNotificationMutation();

  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);
  const groups = useMemo(() => groupNotifications(rows), [rows]);
  const total = data?.pages[0]?.pagination?.total;

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkMarkRead = async () => {
    const unread = selected.filter((id) => {
      const row = rows.find((r) => r._id === id);
      return row && !row.read;
    });
    await Promise.all(unread.map((id) => markRead.mutateAsync(id)));
    setSelected([]);
  };

  const bulkArchive = async () => {
    await Promise.all(selected.map((id) => archive.mutateAsync(id)));
    setSelected([]);
  };

  const bulkDelete = async () => {
    await Promise.all(selected.map((id) => remove.mutateAsync(id)));
    setSelected([]);
  };

  return (
    <AppPageLayout
      title="Notification center"
      subtitle="Filter, manage, and act on workspace alerts"
      embedded
      actions={
        <button
          type="button"
          className="reg-toolbar-btn"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          Mark all read
        </button>
      }
    >
      <div className="notifications-page">
        <NotificationFilters total={total} />

        {selected.length > 0 && (
          <div className="notif-center-toolbar app-card-flat p-3">
            <span className="text-sm text-app-muted">{selected.length} selected</span>
            <button type="button" className="reg-toolbar-btn" onClick={bulkMarkRead}>
              Mark read
            </button>
            <button type="button" className="reg-toolbar-btn" onClick={bulkArchive}>
              Archive
            </button>
            <button type="button" className="reg-toolbar-btn" onClick={bulkDelete}>
              Delete
            </button>
          </div>
        )}

        {isLoading && (
          <div className="app-card-flat p-10 text-center text-app-muted">
            <Loader2 className="animate-spin mx-auto" size={22} />
          </div>
        )}

        {isError && (
          <div className="app-card-flat p-8 text-center text-red-400">
            Could not load notifications.
          </div>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="app-card-flat">
            <NotificationEmptyState />
          </div>
        )}

        <div className="notif-center-list">
          {Object.entries(groups).map(([label, items]) => (
            <section key={label} className="app-card-flat p-3">
              <h3 className="notif-panel__group-label">{label}</h3>
              {items.map((item) => (
                <div key={item._id} className="flex gap-2 items-start">
                  <input
                    type="checkbox"
                    className="mt-4"
                    checked={selected.includes(item._id)}
                    onChange={() => toggleSelect(item._id)}
                    aria-label={`Select ${item.title}`}
                  />
                  <div className="flex-1 min-w-0">
                    <NotificationItem
                      item={item}
                      onRead={(id) => markRead.mutate(id)}
                      onArchive={(id) => archive.mutate(id)}
                      onDelete={(id) => remove.mutate(id)}
                    />
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        {hasNextPage && (
          <button
            type="button"
            className="reg-toolbar-btn mx-auto"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}

        <NotificationPhase2Stub />
      </div>
    </AppPageLayout>
  );
}
