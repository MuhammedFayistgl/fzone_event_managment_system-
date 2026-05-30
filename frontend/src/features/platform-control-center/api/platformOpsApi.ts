import API from "../../../api/axios";

export type PlatformOverview = {
  serverStatus: "ok" | "degraded" | "maintenance";
  maintenanceMode: boolean;
  maintenanceMessage: string;
  uptimeSeconds: number;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  autoRenew: boolean;
  planLimits: {
    storageBytes: number;
    apiRequestsMonth: number;
    maxAdmins: number;
    bandwidthBytesMonth: number;
  };
  usage: {
    storageUsedBytes: number;
    storageLimitBytes: number;
    apiRequestsToday: number;
    apiRequestsMonth: number;
    apiRequestsLimitMonth: number;
    bandwidthBytesToday: number;
    bandwidthBytesMonth: number;
    bandwidthLimitBytes: number;
    adminCount: number;
    adminLimit: number;
  };
  system: {
    memoryUsedBytes: number;
    memoryTotalBytes: number;
    memoryUsedPercent: number;
    processHeapUsedBytes: number;
    cpuLoad1: number;
    cpuLoad5: number;
    cpuLoad15: number;
  };
  mongo: {
    status: string;
    dataSizeBytes: number;
    storageSizeBytes: number;
    indexSizeBytes: number;
    collections: number;
  };
  redis: { status: string; memoryBytes: number };
  connections: { onlineNow: number; activeInvestors: number };
  deployment: {
    serviceName: string;
    environment: string;
    deploymentId: string;
    gitCommit: string;
    gitBranch: string;
    buildTime: string;
    nodeVersion: string;
    hostname: string;
  };
  timestamp: string;
};

export const platformOpsApi = {
  getOverview: () =>
    API.get<{ success: boolean; data: PlatformOverview }>("/admin/platform/ops/overview").then(
      (r) => r.data.data
    ),
  getMetrics: (range = "24h") =>
    API.get("/admin/platform/ops/metrics", { params: { range } }).then((r) => r.data.data),
  getLogs: (page = 1) =>
    API.get("/admin/platform/ops/logs", { params: { page, limit: 20 } }).then((r) => r.data.data),
  getDeployment: () =>
    API.get("/admin/platform/ops/deployment").then((r) => r.data.data),
  patchMaintenance: (payload: { enabled: boolean; message?: string }) =>
    API.patch("/admin/platform/ops/maintenance", payload).then((r) => r.data.data),
  getBillingOverview: () =>
    API.get("/admin/platform/billing/overview").then((r) => r.data.data),
  getPlans: () => API.get("/admin/platform/billing/plans").then((r) => r.data.data),
  subscribe: (payload: { tier: string; billingCycle: "monthly" | "yearly" }) =>
    API.post("/admin/platform/billing/subscribe", payload).then((r) => r.data.data),
  pause: () => API.post("/admin/platform/billing/pause").then((r) => r.data.data),
  resume: () => API.post("/admin/platform/billing/resume").then((r) => r.data.data),
  cancel: () => API.post("/admin/platform/billing/cancel").then((r) => r.data.data),
  toggleAutoRenew: (enabled: boolean) =>
    API.patch("/admin/platform/billing/auto-renew", { enabled }).then((r) => r.data.data),
  getInvoices: (page = 1) =>
    API.get("/admin/platform/billing/invoices", { params: { page } }).then((r) => r.data.data),
  retryPayment: (id: string) =>
    API.post(`/admin/platform/billing/invoices/${id}/retry`).then((r) => r.data.data),
  confirmPayment: (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
  }) => API.post("/admin/platform/billing/confirm-payment", payload).then((r) => r.data.data),
  getAnalytics: (range = "30d") =>
    API.get("/admin/platform/analytics", { params: { range } }).then((r) => r.data.data),
  createBackup: () => API.post("/admin/platform/server/backup").then((r) => r.data.data),
  listBackups: () => API.get("/admin/platform/server/backups").then((r) => r.data.data),
  restoreBackup: (fileName: string) =>
    API.post("/admin/platform/server/restore", { fileName }).then((r) => r.data.data),
  restartServer: () => API.post("/admin/platform/server/restart").then((r) => r.data.data),
  getMaintenanceStatus: () =>
    API.get("/user/maintenance-status").then((r) => r.data.data),
};
