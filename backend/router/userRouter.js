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
  paymentVerifyLimiter,
  paymentFailedLimiter,
  registrationLimiter,
  registrationActionLimiter,
  publicEventLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/checkInvestor", checkInvestorLimiter, checkInvestor);

router.post("/createRegistration", registrationLimiter, registerEvent);
router.post("/check-registration", registrationActionLimiter, checkRegistrationStatus);
router.post("/delete-guest", registrationActionLimiter, deleteGuestFromRegistration);

router.post("/createPayment", paymentCreateLimiter, createOrder);
router.post("/createPaymentVerify", paymentVerifyLimiter, verifyPayment);
router.post("/paymentFailed", paymentFailedLimiter, markPaymentFailed);
router.post("/check-payment-status", registrationActionLimiter, getPaymentStatus);

router.post("/GetOneEventById/:id", publicEventLimiter, GetOneEventById);

export default router;
