import { create } from "zustand";
import type { ReconciliationFilters, ReconciliationStatus } from "../types/reconciliation.types";
import { DEFAULT_FILTERS } from "../types/reconciliation.types";

type SortState = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type ReconciliationStore = {
  filters: ReconciliationFilters;
  pagination: { page: number; limit: number };
  sort: SortState;
  selectedTransactionId: string | null;
  drawerOpen: boolean;
  activeQuickFilter: ReconciliationStatus | "all";
  setFilters: (patch: Partial<ReconciliationFilters>) => void;
  resetFilters: () => void;
  setPagination: (patch: Partial<{ page: number; limit: number }>) => void;
  setSort: (sort: SortState) => void;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  setQuickFilter: (status: ReconciliationStatus | "all") => void;
};

export const useReconciliationStore = create<ReconciliationStore>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  pagination: { page: 1, limit: 25 },
  sort: { sortBy: "createdAt", sortOrder: "desc" },
  selectedTransactionId: null,
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

  openDrawer: (id) =>
    set({ selectedTransactionId: id, drawerOpen: true }),

  closeDrawer: () =>
    set({ drawerOpen: false, selectedTransactionId: null }),

  setQuickFilter: (status) =>
    set((s) => ({
      activeQuickFilter: status,
      filters: {
        ...s.filters,
        reconciliationStatus: status,
      },
      pagination: { ...s.pagination, page: 1 },
    })),
}));
