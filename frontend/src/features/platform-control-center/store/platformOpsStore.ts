import { create } from "zustand";

type Tab = "overview" | "billing" | "analytics" | "server";

type PlatformOpsStore = {
  activeTab: Tab;
  metricsRange: "24h" | "7d" | "30d";
  confirmAction: string | null;
  setActiveTab: (tab: Tab) => void;
  setMetricsRange: (range: "24h" | "7d" | "30d") => void;
  setConfirmAction: (action: string | null) => void;
};

export const usePlatformOpsStore = create<PlatformOpsStore>((set) => ({
  activeTab: "overview",
  metricsRange: "24h",
  confirmAction: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setMetricsRange: (metricsRange) => set({ metricsRange }),
  setConfirmAction: (confirmAction) => set({ confirmAction }),
}));
