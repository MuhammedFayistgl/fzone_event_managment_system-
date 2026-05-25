import { create } from "zustand";
import type { AuditCategory, AuditLogFilters } from "../types/auditLog.types";
import { DEFAULT_FILTERS } from "../types/auditLog.types";

type SortState = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type AuditLogStore = {
  filters: AuditLogFilters;
  pagination: { page: number; limit: number };
  sort: SortState;
  selectedEntryId: string | null;
  drawerOpen: boolean;
  activeQuickFilter: AuditCategory | "all";
  setFilters: (patch: Partial<AuditLogFilters>) => void;
  resetFilters: () => void;
  setPagination: (patch: Partial<{ page: number; limit: number }>) => void;
  setSort: (sort: SortState) => void;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  setQuickFilter: (category: AuditCategory | "all") => void;
};

export const useAuditLogStore = create<AuditLogStore>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  pagination: { page: 1, limit: 25 },
  sort: { sortBy: "createdAt", sortOrder: "desc" },
  selectedEntryId: null,
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

  openDrawer: (id) => set({ selectedEntryId: id, drawerOpen: true }),

  closeDrawer: () => set({ drawerOpen: false, selectedEntryId: null }),

  setQuickFilter: (category) =>
    set((s) => ({
      activeQuickFilter: category,
      filters: { ...s.filters, category },
      pagination: { ...s.pagination, page: 1 },
    })),
}));
