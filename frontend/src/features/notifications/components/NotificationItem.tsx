import { Link } from "react-router-dom";
import { Archive, Check, ExternalLink, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { AppNotification } from "../types/notification.types";
import { PriorityBadge } from "./PriorityBadge";
import { formatRelativeTime } from "../utils/notificationFormat";
import { resolveNotificationHref } from "../../../utils/notificationRoutes";
import { NotificationActions } from "./NotificationActions";

type Props = {
  item: AppNotification;
  compact?: boolean;
  onRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNavigate?: () => void;
};

export function NotificationItem({
  item,
  compact,
  onRead,
  onArchive,
  onDelete,
  onNavigate,
}: Props) {
  const href = resolveNotificationHref(item);

  return (
    <article
      className={clsx(
        "notif-item",
        !item.read && "notif-item--unread",
        item.pinned && "notif-item--pinned",
        compact && "notif-item--compact"
      )}
    >
      <div className="notif-item__main">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="notif-item__title">{item.title}</p>
            <p className="notif-item__message">{item.message}</p>
          </div>
          <PriorityBadge priority={item.priority} />
        </div>
        <div className="notif-item__meta">
          <span>{formatRelativeTime(item.createdAt)}</span>
          <span className="capitalize">{item.category}</span>
        </div>
        <NotificationActions
          notificationId={item._id}
          actions={item.actions}
          onDone={onNavigate}
        />
      </div>

      <div className="notif-item__actions">
        <Link
          to={href}
          className="notif-item__btn"
          onClick={() => {
            if (!item.read) onRead?.(item._id);
            onNavigate?.();
          }}
        >
          <ExternalLink size={14} />
          Open
        </Link>
        {!item.read && onRead && (
          <button type="button" className="notif-item__btn" onClick={() => onRead(item._id)}>
            <Check size={14} />
            Read
          </button>
        )}
        {onArchive && (
          <button type="button" className="notif-item__btn" onClick={() => onArchive(item._id)}>
            <Archive size={14} />
          </button>
        )}
        {onDelete && !compact && (
          <button type="button" className="notif-item__btn notif-item__btn--danger" onClick={() => onDelete(item._id)}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
