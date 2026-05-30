import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformOpsApi } from "../api/platformOpsApi";

export const platformOpsKeys = {
  overview: ["platform-ops", "overview"] as const,
  metrics: (range: string) => ["platform-ops", "metrics", range] as const,
  logs: (page: number) => ["platform-ops", "logs", page] as const,
  billing: ["platform-ops", "billing"] as const,
  plans: ["platform-ops", "plans"] as const,
  invoices: (page: number) => ["platform-ops", "invoices", page] as const,
  analytics: (range: string) => ["platform-ops", "analytics", range] as const,
  backups: ["platform-ops", "backups"] as const,
  maintenance: ["platform-ops", "maintenance"] as const,
};

export function usePlatformOverview() {
  return useQuery({
    queryKey: platformOpsKeys.overview,
    queryFn: platformOpsApi.getOverview,
    refetchInterval: 30_000,
  });
}

export function usePlatformMetrics(range: string) {
  return useQuery({
    queryKey: platformOpsKeys.metrics(range),
    queryFn: () => platformOpsApi.getMetrics(range),
    refetchInterval: 60_000,
  });
}

export function usePlatformLogs(page = 1) {
  return useQuery({
    queryKey: platformOpsKeys.logs(page),
    queryFn: () => platformOpsApi.getLogs(page),
  });
}

export function useBillingOverview() {
  return useQuery({
    queryKey: platformOpsKeys.billing,
    queryFn: platformOpsApi.getBillingOverview,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: platformOpsKeys.plans,
    queryFn: platformOpsApi.getPlans,
  });
}

export function usePlatformInvoices(page = 1) {
  return useQuery({
    queryKey: platformOpsKeys.invoices(page),
    queryFn: () => platformOpsApi.getInvoices(page),
  });
}

export function usePlatformAnalytics(range = "30d") {
  return useQuery({
    queryKey: platformOpsKeys.analytics(range),
    queryFn: () => platformOpsApi.getAnalytics(range),
  });
}

export function usePlatformBackups() {
  return useQuery({
    queryKey: platformOpsKeys.backups,
    queryFn: platformOpsApi.listBackups,
  });
}

export function useMaintenanceStatus() {
  return useQuery({
    queryKey: platformOpsKeys.maintenance,
    queryFn: platformOpsApi.getMaintenanceStatus,
    refetchInterval: 60_000,
  });
}

export function usePlatformOpsMutations() {
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["platform-ops"] });
  };

  return {
    patchMaintenance: useMutation({
      mutationFn: platformOpsApi.patchMaintenance,
      onSuccess: invalidateAll,
    }),
    subscribe: useMutation({
      mutationFn: platformOpsApi.subscribe,
      onSuccess: invalidateAll,
    }),
    pause: useMutation({ mutationFn: platformOpsApi.pause, onSuccess: invalidateAll }),
    resume: useMutation({ mutationFn: platformOpsApi.resume, onSuccess: invalidateAll }),
    cancel: useMutation({ mutationFn: platformOpsApi.cancel, onSuccess: invalidateAll }),
    toggleAutoRenew: useMutation({
      mutationFn: platformOpsApi.toggleAutoRenew,
      onSuccess: invalidateAll,
    }),
    retryPayment: useMutation({
      mutationFn: platformOpsApi.retryPayment,
      onSuccess: invalidateAll,
    }),
    confirmPayment: useMutation({
      mutationFn: platformOpsApi.confirmPayment,
      onSuccess: invalidateAll,
    }),
    createBackup: useMutation({
      mutationFn: platformOpsApi.createBackup,
      onSuccess: invalidateAll,
    }),
    restoreBackup: useMutation({
      mutationFn: platformOpsApi.restoreBackup,
      onSuccess: invalidateAll,
    }),
    restartServer: useMutation({
      mutationFn: platformOpsApi.restartServer,
      onSuccess: invalidateAll,
    }),
  };
}
