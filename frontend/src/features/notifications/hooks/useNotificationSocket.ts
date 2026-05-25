import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLiveSocket } from "../../../live/socket";
import { notificationKeys } from "../api/notificationApi";
import { useNotificationStore } from "../store/notificationStore";
import { playNotificationSound } from "../../../utils/notificationRoutes";

export function useNotificationSocket(enabled = true) {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const prependLive = useNotificationStore((s) => s.prependLive);
  const setLastSyncAt = useNotificationStore((s) => s.setLastSyncAt);
  const soundEnabled = useNotificationStore((s) => s.soundEnabled);

  useEffect(() => {
    if (!enabled) return;

    const socket = getLiveSocket();
    socket.emit("join:staff");

    const onNew = (payload: {
      notification: Parameters<typeof prependLive>[0];
      unreadCount: number;
    }) => {
      if (payload?.notification) {
        prependLive(payload.notification);
        if (soundEnabled) {
          playNotificationSound(payload.notification.priority);
        }
      }
      if (typeof payload?.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
      setLastSyncAt(new Date().toISOString());
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    };

    const onUpdated = (payload: { unreadCount?: number }) => {
      if (typeof payload?.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    };

    socket.on("notification:new", onNew);
    socket.on("notification:updated", onUpdated);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("notification:updated", onUpdated);
      socket.emit("leave:staff");
    };
  }, [enabled, prependLive, qc, setLastSyncAt, setUnreadCount, soundEnabled]);
}
