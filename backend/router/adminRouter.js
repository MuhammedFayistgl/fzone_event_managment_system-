import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole, requireAnyRole } from "../middleware/roleMiddleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

import {
  deleteInvestor,
  fetchInvestorData,
  getDashboardSummary,
  registrationDetails,
  blockRegistrationParticipant,
  paymentLedger,
  issuePaymentRefund,
  previewPaymentRefundAccess,
  fixInvestorGendersFromNames,
  updateInvestor,
  uploadInvestorDetails,
} from "../controllers/adminController.js";

import {
  loginAdmin,
  logout,
  refreshToken,
  signupAdmin,
} from "../controllers/authController.js";

import {
  createEvent,
  eventDelete,
  getAllEvents,
  getDashboardEventsWithRegistrations,
  updateEvent,
} from "../controllers/eventController.js";

import {
  verifyQR,
  closeRegistration,
} from "../controllers/registrationController.js";

import {
  uploadTicketBackground,
  deleteTicketBackground,
  updateTicketDesignMode,
} from "../controllers/ticketDesignController.js";

import {
  getPlatformSettings,
  patchPlatformSettings,
  getAuditLogs,
  getAuditLogSummary,
  getAuditLogDetail,
  getAuditLogAnalytics,
  exportAuditLogsHandler,
  getWebhookDeliveries,
  getWebhookSummary,
  getWebhookDetail,
  getWebhookAnalytics,
  exportWebhooksHandler,
  getAllRegistrations,
  exportAllRegistrations,
  exportPaymentLedgerAll,
  getFinanceReconciliation,
  getReconciliationSummary,
  getReconciliationTransactions,
  getReconciliationTransactionDetail,
  getReconciliationAnalytics,
  getReconciliationActivity,
  exportReconciliation,
  resolveReconciliationTransaction,
  getWaitlist,
  getGateNames,
} from "../controllers/platformController.js";

import { ticketBackgroundUpload } from "../middleware/ticketUpload.middleware.js";
import { notificationLimiter } from "../middleware/rateLimit.middleware.js";
import {
  archiveNotificationHandler,
  deleteNotificationHandler,
  executeActionHandler,
  getNotificationDetailHandler,
  getNotificationPreferencesHandler,
  getRecentAlertsHandler,
  getUnreadCountHandler,
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
} from "../controllers/notificationController.js";

import {
  downloadInvestorImportErrorReport,
  downloadInvestorTemplate,
  exportInvestorsXlsx,
  getInvestorImportHistory,
  getInvestorSchemaHandler,
  investorImportCommit,
  investorImportDryRun,
} from "../controllers/investorImportController.js";

import {
  handleInvestorImportUploadError,
  investorImportUpload,
} from "../middleware/investorImportUpload.middleware.js";

const router = express.Router();

/** Admin routes are always protected — no env bypass. */
const protectAdmin = [authMiddleware, requireRole("admin")];
const protectStaff = [authMiddleware, requireAnyRole("admin", "scanner", "finance")];
const protectScanner = [authMiddleware, requireAnyRole("admin", "scanner")];
const protectFinance = [authMiddleware, requireAnyRole("admin", "finance")];

// ================= PUBLIC (auth) =================
router.post("/login", authLimiter, loginAdmin);
router.post("/signup", authLimiter, signupAdmin);
router.post("/refresh", authLimiter, refreshToken);
router.post("/logout", logout);

// ================= PROTECTED (admin) =================
router.post("/uploadInvestorDetails", ...protectAdmin, uploadInvestorDetails);
router.post("/getInvestorDetails", ...protectAdmin, fetchInvestorData);
router.get("/getDashboardSummary", ...protectStaff, getDashboardSummary);
router.put("/updateInvestor/:id", ...protectAdmin, updateInvestor);
router.post("/investors/fix-gender-from-names", ...protectAdmin, fixInvestorGendersFromNames);
router.delete("/deleteInvestor/:id", ...protectAdmin, deleteInvestor);

// Investor Data Studio (schema, template, import)
router.get("/investors/schema", ...protectAdmin, getInvestorSchemaHandler);
router.get("/investors/template.xlsx", ...protectAdmin, downloadInvestorTemplate);
router.get("/investors/export.xlsx", ...protectAdmin, exportInvestorsXlsx);
router.get("/investors/import/history", ...protectAdmin, getInvestorImportHistory);
router.post(
  "/investors/import/dry-run",
  ...protectAdmin,
  investorImportUpload.single("file"),
  handleInvestorImportUploadError,
  investorImportDryRun
);
router.post(
  "/investors/import/error-report",
  ...protectAdmin,
  investorImportUpload.single("file"),
  handleInvestorImportUploadError,
  downloadInvestorImportErrorReport
);
router.post(
  "/investors/import/commit",
  ...protectAdmin,
  investorImportUpload.single("file"),
  handleInvestorImportUploadError,
  investorImportCommit
);

// Events
router.post("/createvent", ...protectAdmin, createEvent);
router.get("/createdevents", ...protectStaff, getAllEvents);
router.delete("/eventDelete/:id", ...protectAdmin, eventDelete);
router.put("/eventedit/:id", ...protectAdmin, updateEvent);
router.get(
  "/getRunningEventsWithRegistrations",
  ...protectStaff,
  getDashboardEventsWithRegistrations
);
router.patch("/events/:id/close-registration", ...protectAdmin, closeRegistration);

router.post(
  "/events/:id/ticket-background",
  ...protectAdmin,
  ticketBackgroundUpload.single("background"),
  uploadTicketBackground
);
router.delete("/events/:id/ticket-background", ...protectAdmin, deleteTicketBackground);
router.patch("/events/:id/ticket-design", ...protectAdmin, updateTicketDesignMode);

// QR check-in
router.post("/verify-qr", ...protectScanner, verifyQR);

// Registration reports
router.post("/RegistrationDetils", ...protectStaff, registrationDetails);
router.post("/all-registrations", ...protectStaff, getAllRegistrations);
router.post("/all-registrations/export", ...protectStaff, exportAllRegistrations);
router.post("/payment-ledger", ...protectFinance, paymentLedger);
router.post("/payment-ledger/export", ...protectFinance, exportPaymentLedgerAll);
router.post("/payments/:paymentId/refund", ...protectFinance, issuePaymentRefund);
router.post(
  "/payments/:paymentId/refund-preview",
  ...protectFinance,
  previewPaymentRefundAccess
);
router.patch(
  "/registrations/:registrationId/block",
  ...protectAdmin,
  blockRegistrationParticipant
);

// Platform / SaaS
router.get("/platform/settings", ...protectAdmin, getPlatformSettings);
router.patch("/platform/settings", ...protectAdmin, patchPlatformSettings);
router.get("/platform/audit-logs/summary", ...protectAdmin, getAuditLogSummary);
router.get("/platform/audit-logs/analytics", ...protectAdmin, getAuditLogAnalytics);
router.post("/platform/audit-logs/export", ...protectAdmin, exportAuditLogsHandler);
router.get("/platform/audit-logs/:id", ...protectAdmin, getAuditLogDetail);
router.get("/platform/audit-logs", ...protectAdmin, getAuditLogs);
router.get("/platform/webhooks/summary", ...protectAdmin, getWebhookSummary);
router.get("/platform/webhooks/analytics", ...protectAdmin, getWebhookAnalytics);
router.post("/platform/webhooks/export", ...protectAdmin, exportWebhooksHandler);
router.get("/platform/webhooks/:id", ...protectAdmin, getWebhookDetail);
router.get("/platform/webhooks", ...protectAdmin, getWebhookDeliveries);
router.get("/platform/reconciliation", ...protectFinance, getFinanceReconciliation);
router.get("/platform/reconciliation/summary", ...protectFinance, getReconciliationSummary);
router.get("/platform/reconciliation/transactions", ...protectFinance, getReconciliationTransactions);
router.get("/platform/reconciliation/transactions/:id", ...protectFinance, getReconciliationTransactionDetail);
router.get("/platform/reconciliation/analytics", ...protectFinance, getReconciliationAnalytics);
router.get("/platform/reconciliation/activity", ...protectFinance, getReconciliationActivity);
router.post("/platform/reconciliation/export", ...protectFinance, exportReconciliation);
router.post("/platform/reconciliation/transactions/:id/resolve", ...protectFinance, resolveReconciliationTransaction);
router.get("/platform/waitlist", ...protectAdmin, getWaitlist);
router.get("/platform/gates", ...protectScanner, getGateNames);

// Notifications (staff inbox)
router.get("/notifications/unread-count", ...protectStaff, notificationLimiter, getUnreadCountHandler);
router.get("/notifications/recent-alerts", ...protectStaff, notificationLimiter, getRecentAlertsHandler);
router.get("/notifications/preferences", ...protectStaff, getNotificationPreferencesHandler);
router.post("/notifications/read-all", ...protectStaff, notificationLimiter, markAllReadHandler);
router.get("/notifications/:id", ...protectStaff, notificationLimiter, getNotificationDetailHandler);
router.post("/notifications/:id/read", ...protectStaff, notificationLimiter, markReadHandler);
router.post("/notifications/:id/archive", ...protectStaff, notificationLimiter, archiveNotificationHandler);
router.post("/notifications/:id/actions/:actionId", ...protectStaff, notificationLimiter, executeActionHandler);
router.delete("/notifications/:id", ...protectStaff, notificationLimiter, deleteNotificationHandler);
router.get("/notifications", ...protectStaff, notificationLimiter, listNotificationsHandler);

export default router;
