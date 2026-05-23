import express from "express";
import { checkInvestor, GetOneEventById } from "../controllers/userController.js";
import {
  checkRegistrationStatus,
  deleteGuestFromRegistration,
  registerEvent,
} from "../controllers/registrationController.js";
import {
  createOrder,
  getPaymentStatus,
  markPaymentFailed,
  verifyPayment,
} from "../controllers/paymentController.js";
import {
  checkInvestorLimiter,
  paymentCreateLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/checkInvestor", checkInvestorLimiter, checkInvestor);

// Registration (public — staff-assisted UI; rate-limited)
router.post("/createRegistration", registerEvent);
router.post("/check-registration", checkRegistrationStatus);
router.post("/delete-guest", deleteGuestFromRegistration);

// Payment (preserve existing flow)
router.post("/createPayment", paymentCreateLimiter, createOrder);
router.post("/createPaymentVerify", verifyPayment);
router.post("/paymentFailed", markPaymentFailed);
router.post("/check-payment-status", getPaymentStatus);

router.post("/GetOneEventById/:id", GetOneEventById);

export default router;
