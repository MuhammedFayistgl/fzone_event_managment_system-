import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import attachAdmin from "../middleware/attachAdmin.js";
import {
  requireAnyRole,
  requireSuperAdmin,
  requireActiveStaff,
  requirePermission,
  requirePermissionOrRole,
} from "../middleware/roleMiddleware.js";
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

import {
  listStaff,
  createStaff,
  activateStaff,
  disableStaff,
  updateStaffPermissions,
  getPermissionsCatalog,
  getAdminProfile,
} from "../controllers/staffController.js";

const router = express.Router();

const auth = authMiddleware;
const loadAdmin = attachAdmin;
const active = requireActiveStaff();

const protectSuperAdmin = [auth, loadAdmin, requireSuperAdmin()];
const protectStaff = [auth, loadAdmin, active, requireAnyRole("super_admin", "admin", "scanner", "finance")];
const protectScanner = [auth, loadAdmin, active, requireAnyRole("super_admin", "admin", "scanner")];
const protectFinance = [auth, loadAdmin, active, requireAnyRole("super_admin", "admin", "finance")];
const protectMe = [auth, loadAdmin, active, requireAnyRole("super_admin", "admin", "scanner", "finance")];

const permEventsRead = requirePermissionOrRole("events:read", "scanner", "finance");
const permEventsWrite = requirePermission("events:write");
const permInvestorsRead = requirePermission("investors:read");
const permInvestorsWrite = requirePermission("investors:write");
const permInvestorsImport = requirePermission("investors:import");
const permRegistrationsRead = requirePermissionOrRole("registrations:read", "scanner", "finance");
const permRegistrationsWrite = requirePermission("registrations:write");
const permSettingsWrite = requirePermission("settings:write");
const permAuditRead = requirePermission("audit:read");

// ================= PUBLIC (auth) =================
router.post("/login", authLimiter, loginAdmin);
router.post("/signup", authLimiter, signupAdmin);
router.post("/refresh", authLimiter, refreshToken);
router.post("/logout", logout);

// Current admin profile (permissions for UI gating)
router.get("/me", ...protectMe, getAdminProfile);

// ================= PROTECTED (admin) =================
router.post("/uploadInvestorDetails", ...protectStaff, permInvestorsImport, uploadInvestorDetails);
router.post("/getInvestorDetails", ...protectStaff, permInvestorsRead, fetchInvestorData);
router.get("/getDashboardSummary", ...protectStaff, permEventsRead, getDashboardSummary);
router.put("/updateInvestor/:id", ...protectStaff, permInvestorsWrite, updateInvestor);
router.post("/investors/fix-gender-from-names", ...protectStaff, permInvestorsWrite, fixInvestorGendersFromNames);
router.delete("/deleteInvestor/:id", ...protectStaff, permInvestorsWrite, deleteInvestor);

// Investor Data Studio (schema, template, import)
router.get("/investors/schema", ...protectStaff, permInvestorsImport, getInvestorSchemaHandler);
router.get("/investors/template.xlsx", ...protectStaff, permInvestorsImport, downloadInvestorTemplate);
router.get("/investors/export.xlsx", ...protectStaff, permInvestorsRead, exportInvestorsXlsx);
router.get("/investors/import/history", ...protectStaff, permInvestorsImport, getInvestorImportHistory);
router.post(
  "/investors/import/dry-run",
  ...protectStaff,
  permInvestorsImport,
  investorImportUpload.single("file"),
  handleInvestorImportUploadError,
  investorImportDryRun
);
router.post(
  "/investors/import/error-report",
  ...protectStaff,
  permInvestorsImport,
  investorImportUpload.single("file"),
  handleInvestorImportUploadError,
  downloadInvestorImportErrorReport
);
router.post(
  "/investors/import/commit",
  ...protectStaff,
  permInvestorsImport,
  investorImportUpload.single("file"),
  handleInvestorImportUploadError,
  investorImportCommit
);

// Events
router.post("/createvent", ...protectStaff, permEventsWrite, createEvent);
router.get("/createdevents", ...protectStaff, permEventsRead, getAllEvents);
router.delete("/eventDelete/:id", ...protectStaff, permEventsWrite, eventDelete);
router.put("/eventedit/:id", ...protectStaff, permEventsWrite, updateEvent);
router.get(
  "/getRunningEventsWithRegistrations",
  ...protectStaff,
  permEventsRead,
  getDashboardEventsWithRegistrations
);
router.patch("/events/:id/close-registration", ...protectStaff, permRegistrationsWrite, closeRegistration);

router.post(
  "/events/:id/ticket-background",
  ...protectStaff,
  permEventsWrite,
  ticketBackgroundUpload.single("background"),
  uploadTicketBackground
);
router.delete("/events/:id/ticket-background", ...protectStaff, permEventsWrite, deleteTicketBackground);
router.patch("/events/:id/ticket-design", ...protectStaff, permEventsWrite, updateTicketDesignMode);

// QR check-in
router.post("/verify-qr", ...protectScanner, verifyQR);

// Registration reports
router.post("/RegistrationDetils", ...protectStaff, permRegistrationsRead, registrationDetails);
router.post("/all-registrations", ...protectStaff, permRegistrationsRead, getAllRegistrations);
router.post("/all-registrations/export", ...protectStaff, permRegistrationsRead, exportAllRegistrations);
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
  ...protectStaff,
  permRegistrationsWrite,
  blockRegistrationParticipant
);

// Platform / SaaS
router.get("/platform/settings", ...protectStaff, permSettingsWrite, getPlatformSettings);
router.patch("/platform/settings", ...protectStaff, permSettingsWrite, patchPlatformSettings);
router.get("/platform/staff", ...protectSuperAdmin, listStaff);
router.post("/platform/staff", ...protectSuperAdmin, createStaff);
router.patch("/platform/staff/:id/activate", ...protectSuperAdmin, activateStaff);
router.patch("/platform/staff/:id/disable", ...protectSuperAdmin, disableStaff);
router.patch("/platform/staff/:id/permissions", ...protectSuperAdmin, updateStaffPermissions);
router.get("/platform/permissions/catalog", ...protectSuperAdmin, getPermissionsCatalog);
router.get("/platform/audit-logs/summary", ...protectStaff, permAuditRead, getAuditLogSummary);
router.get("/platform/audit-logs/analytics", ...protectStaff, permAuditRead, getAuditLogAnalytics);
router.post("/platform/audit-logs/export", ...protectStaff, permAuditRead, exportAuditLogsHandler);
router.get("/platform/audit-logs/:id", ...protectStaff, permAuditRead, getAuditLogDetail);
router.get("/platform/audit-logs", ...protectStaff, permAuditRead, getAuditLogs);
router.get("/platform/webhooks/summary", ...protectStaff, permAuditRead, getWebhookSummary);
router.get("/platform/webhooks/analytics", ...protectStaff, permAuditRead, getWebhookAnalytics);
router.post("/platform/webhooks/export", ...protectStaff, permAuditRead, exportWebhooksHandler);
router.get("/platform/webhooks/:id", ...protectStaff, permAuditRead, getWebhookDetail);
router.get("/platform/webhooks", ...protectStaff, permAuditRead, getWebhookDeliveries);
router.get("/platform/reconciliation", ...protectFinance, getFinanceReconciliation);
router.get("/platform/reconciliation/summary", ...protectFinance, getReconciliationSummary);
router.get("/platform/reconciliation/transactions", ...protectFinance, getReconciliationTransactions);
router.get("/platform/reconciliation/transactions/:id", ...protectFinance, getReconciliationTransactionDetail);
router.get("/platform/reconciliation/analytics", ...protectFinance, getReconciliationAnalytics);
router.get("/platform/reconciliation/activity", ...protectFinance, getReconciliationActivity);
router.post("/platform/reconciliation/export", ...protectFinance, exportReconciliation);
router.post("/platform/reconciliation/transactions/:id/resolve", ...protectFinance, resolveReconciliationTransaction);
router.get("/platform/waitlist", ...protectStaff, permSettingsWrite, getWaitlist);
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
