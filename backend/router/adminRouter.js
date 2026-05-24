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
  getWebhookDeliveries,
  getAllRegistrations,
  exportAllRegistrations,
  exportPaymentLedgerAll,
  getFinanceReconciliation,
  getWaitlist,
  getGateNames,
} from "../controllers/platformController.js";

import { ticketBackgroundUpload } from "../middleware/ticketUpload.middleware.js";

const router = express.Router();

const adminAuthEnabled = () => process.env.REQUIRE_ADMIN_AUTH !== "false";

const protectAdmin = adminAuthEnabled()
  ? [authMiddleware, requireRole("admin")]
  : [];
const protectStaff = adminAuthEnabled()
  ? [authMiddleware, requireAnyRole("admin", "scanner", "finance")]
  : [];
const protectScanner = adminAuthEnabled()
  ? [authMiddleware, requireAnyRole("admin", "scanner")]
  : [];
const protectFinance = adminAuthEnabled()
  ? [authMiddleware, requireAnyRole("admin", "finance")]
  : [];
const maybeProtect = protectAdmin;

// ================= PUBLIC (auth) =================
router.post("/login", authLimiter, loginAdmin);
router.post("/signup", authLimiter, signupAdmin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// ================= PROTECTED (admin) =================
router.post("/uploadInvestorDetails", ...protectAdmin, uploadInvestorDetails);
router.post("/getInvestorDetails", ...protectAdmin, fetchInvestorData);
router.get("/getDashboardSummary", ...protectStaff, getDashboardSummary);
router.put("/updateInvestor/:id", ...protectAdmin, updateInvestor);
router.delete("/deleteInvestor/:id", ...protectAdmin, deleteInvestor);

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
router.get("/platform/audit-logs", ...protectAdmin, getAuditLogs);
router.get("/platform/webhooks", ...protectAdmin, getWebhookDeliveries);
router.get("/platform/reconciliation", ...protectFinance, getFinanceReconciliation);
router.get("/platform/waitlist", ...protectAdmin, getWaitlist);
router.get("/platform/gates", ...protectScanner, getGateNames);

export default router;
