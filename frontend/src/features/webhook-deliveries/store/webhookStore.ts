import { create } from "zustand";
import type { WebhookFilters, WebhookStatus } from "../types/webhook.types";
import { DEFAULT_FILTERS } from "../types/webhook.types";

type SortState = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type WebhookStore = {
  filters: WebhookFilters;
  pagination: { page: number; limit: number };
  sort: SortState;
  selectedId: string | null;
  drawerOpen: boolean;
  activeQuickFilter: WebhookStatus | "all";
  setFilters: (patch: Partial<WebhookFilters>) => void;
  resetFilters: () => void;
  setPagination: (patch: Partial<{ page: number; limit: number }>) => void;
  setSort: (sort: SortState) => void;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  setQuickFilter: (status: WebhookStatus | "all") => void;
};

export const useWebhookStore = create<WebhookStore>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  pagination: { page: 1, limit: 25 },
  sort: { sortBy: "createdAt", sortOrder: "desc" },
  selectedId: null,
  drawerOpen: false,
  activeQuickFilter: "all",

  setFilters: (patch) =>
    set((s) => ({
      filters: { ...s.filters, ...patch },
      pagination: { ...s.pagination, page: 1 },
    })),

  resetFilters: () =>
    set({
      filters: { ...DEFAULT_FILTERS },
      pagination: { page: 1, limit: 25 },
      activeQuickFilter: "all",
    }),

  setPagination: (patch) =>
    set((s) => ({ pagination: { ...s.pagination, ...patch } })),

  setSort: (sort) =>
    set((s) => ({ sort, pagination: { ...s.pagination, page: 1 } })),

  openDrawer: (id) => set({ selectedId: id, drawerOpen: true }),

  closeDrawer: () => set({ drawerOpen: false, selectedId: null }),

  setQuickFilter: (status) =>
    set((s) => ({
      activeQuickFilter: status,
      filters: { ...s.filters, status },
      pagination: { ...s.pagination, page: 1 },
    })),
}));
