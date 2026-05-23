import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

import {
  deleteInvestor,
  fetchInvestorData,
  getDashboardSummary,
  registrationDetails,
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
  getUpcomingEventsWithRegistrations,
  updateEvent,
} from "../controllers/eventController.js";

import {
  verifyQR,
  closeRegistration,
} from "../controllers/registrationController.js";

const router = express.Router();

const adminAuthEnabled = () => process.env.REQUIRE_ADMIN_AUTH !== "false";

const protect = [authMiddleware, requireRole("admin")];
const maybeProtect = adminAuthEnabled() ? protect : [];

// ================= PUBLIC (auth) =================
router.post("/login", authLimiter, loginAdmin);
router.post("/signup", authLimiter, signupAdmin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// ================= PROTECTED (admin) =================
router.post("/uploadInvestorDetails", ...maybeProtect, uploadInvestorDetails);
router.post("/getInvestorDetails", ...maybeProtect, fetchInvestorData);
router.get("/getDashboardSummary", ...maybeProtect, getDashboardSummary);
router.put("/updateInvestor/:id", ...maybeProtect, updateInvestor);
router.delete("/deleteInvestor/:id", ...maybeProtect, deleteInvestor);

// Events
router.post("/createvent", ...maybeProtect, createEvent);
router.get("/createdevents", ...maybeProtect, getAllEvents);
router.delete("/eventDelete/:id", ...maybeProtect, eventDelete);
router.put("/eventedit/:id", ...maybeProtect, updateEvent);
router.get(
  "/getRunningEventsWithRegistrations",
  ...maybeProtect,
  getUpcomingEventsWithRegistrations
);
router.patch("/events/:id/close-registration", ...maybeProtect, closeRegistration);

// QR check-in
router.post("/verify-qr", ...maybeProtect, verifyQR);

// Registration reports
router.post("/RegistrationDetils", ...maybeProtect, registrationDetails);

export default router;
