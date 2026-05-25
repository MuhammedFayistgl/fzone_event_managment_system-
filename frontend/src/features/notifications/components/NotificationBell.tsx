import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useNotificationStore } from "../store/notificationStore";
import { useUnreadCountQuery } from "../hooks/useNotificationQueries";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import { NotificationPanel } from "./NotificationPanel";
import "../notifications.css";

export function NotificationBell() {
  useNotificationSocket(true);
  useUnreadCountQuery();

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const panelOpen = useNotificationStore((s) => s.panelOpen);
  const togglePanel = useNotificationStore((s) => s.togglePanel);
  const setPanelOpen = useNotificationStore((s) => s.setPanelOpen);

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative">
      <motion.button
        type="button"
        className="notif-bell-btn"
        onClick={togglePanel}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 0] } : { rotate: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-bell-badge">{badge}</span>}
      </motion.button>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
