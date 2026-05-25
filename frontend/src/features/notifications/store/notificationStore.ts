import { create } from "zustand";
import type { AppNotification, NotificationFilters } from "../types/notification.types";
import { DEFAULT_NOTIFICATION_FILTERS } from "../types/notification.types";

type NotificationStore = {
  unreadCount: number;
  panelOpen: boolean;
  filters: NotificationFilters;
  lastSyncAt: string | null;
  liveItems: AppNotification[];
  soundEnabled: boolean;
  setUnreadCount: (count: number) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setFilters: (patch: Partial<NotificationFilters>) => void;
  resetFilters: () => void;
  setLastSyncAt: (iso: string) => void;
  prependLive: (item: AppNotification) => void;
  setSoundEnabled: (enabled: boolean) => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  panelOpen: false,
  filters: { ...DEFAULT_NOTIFICATION_FILTERS },
  lastSyncAt: null,
  liveItems: [],
  soundEnabled: true,

  setUnreadCount: (count) => set({ unreadCount: count }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: { ...DEFAULT_NOTIFICATION_FILTERS } }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  prependLive: (item) =>
    set((s) => ({
      liveItems: [item, ...s.liveItems.filter((x) => x._id !== item._id)].slice(0, 20),
    })),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
}));
