import {
  getOpsOverview,
  getMetricsTimeSeries,
  listErrorLogs,
  setMaintenanceMode,
  getDeploymentSnapshot,
  logServerEvent,
} from "../services/platformOpsService.js";
import {
  listSubscriptionPlans,
  getBillingOverview,
  subscribeToPlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  listInvoices,
  retryInvoicePayment,
  confirmPlatformPayment,
  getAnalyticsData,
  toggleAutoRenew,
  handlePlatformBillingWebhook,
} from "../services/platformBillingService.js";
import {
  createDatabaseBackup,
  listDatabaseBackups,
  restoreDatabaseBackup,
  restartDeployment,
  verifyPlatformWebhookSignature,
} from "../services/platformBackupService.js";
import { getMaintenanceStatus } from "../middleware/maintenance.middleware.js";

export const getPlatformOpsOverview = async (_req, res) => {
  try {
    const data = await getOpsOverview();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformOpsMetrics = async (req, res) => {
  try {
    const data = await getMetricsTimeSeries(req.query.range || "24h");
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformOpsLogs = async (req, res) => {
  try {
    const data = await listErrorLogs({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformOpsDeployment = async (_req, res) => {
  try {
    const data = getDeploymentSnapshot();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const patchPlatformMaintenance = async (req, res) => {
  try {
    const { enabled, message } = req.body || {};
    const data = await setMaintenanceMode(
      { enabled: Boolean(enabled), message },
      req.admin || req.user
    );
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformMaintenancePublic = async (_req, res) => {
  try {
    const data = await getMaintenanceStatus();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformBillingPlans = async (_req, res) => {
  try {
    const data = await listSubscriptionPlans();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformBillingOverview = async (_req, res) => {
  try {
    const data = await getBillingOverview();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postPlatformSubscribe = async (req, res) => {
  try {
    const data = await subscribeToPlan(req.body || {}, req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const postPlatformPause = async (req, res) => {
  try {
    const data = await pauseSubscription(req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postPlatformResume = async (req, res) => {
  try {
    const data = await resumeSubscription(req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postPlatformCancel = async (req, res) => {
  try {
    const data = await cancelSubscription(req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformInvoices = async (req, res) => {
  try {
    const data = await listInvoices({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postPlatformRetryPayment = async (req, res) => {
  try {
    const data = await retryInvoicePayment(req.params.id, req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const postPlatformConfirmPayment = async (req, res) => {
  try {
    const data = await confirmPlatformPayment(req.body || {});
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const patchPlatformAutoRenew = async (req, res) => {
  try {
    const data = await toggleAutoRenew(Boolean(req.body?.enabled), req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlatformAnalytics = async (req, res) => {
  try {
    const data = await getAnalyticsData(req.query.range || "30d");
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postPlatformBackup = async (req, res) => {
  try {
    const data = await createDatabaseBackup(req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getPlatformBackups = async (_req, res) => {
  try {
    const data = await listDatabaseBackups();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postPlatformRestore = async (req, res) => {
  try {
    const data = await restoreDatabaseBackup(req.body?.fileName, req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const postPlatformRestart = async (req, res) => {
  try {
    const data = await restartDeployment(req.admin || req.user, req);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const platformBillingWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;
    const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : JSON.stringify(rawBody);

    if (!verifyPlatformWebhookSignature(bodyString, signature)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = Buffer.isBuffer(rawBody) ? JSON.parse(bodyString) : rawBody;
    await handlePlatformBillingWebhook(event, bodyString);
    return res.json({ success: true });
  } catch (err) {
    await logServerEvent("error", "Platform billing webhook failed", { message: err.message });
    return res.status(500).json({ success: false, message: err.message });
  }
};
