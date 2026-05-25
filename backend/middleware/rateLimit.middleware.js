import rateLimit from "express-rate-limit";

const jsonHandler = (req, res, _next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

const enabled = () => process.env.RATE_LIMIT_ENABLED !== "false";

const createLimiter = (windowMs, max, message) => {
  if (!enabled()) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonHandler,
    message,
  });
};

/** Login / signup / refresh brute-force protection */
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_LOGIN_MAX || "20", 10)
);

/** Public investor lookup */
export const checkInvestorLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_CHECK_INVESTOR_MAX || "60", 10)
);

/** Payment order creation */
export const paymentCreateLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || "30", 10)
);

/** Registration create/update */
export const registrationLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX || "40", 10)
);

/** Payment verification */
export const paymentVerifyLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_PAYMENT_VERIFY_MAX || "30", 10)
);

/** Mark payment failed — abuse prevention */
export const paymentFailedLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_PAYMENT_FAILED_MAX || "15", 10)
);

/** Registration status / guest delete */
export const registrationActionLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_REGISTRATION_ACTION_MAX || "40", 10)
);

/** Public event fetch */
export const publicEventLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_PUBLIC_EVENT_MAX || "120", 10)
);

/** Notification inbox list / actions */
export const notificationLimiter = createLimiter(
  60 * 1000,
  parseInt(process.env.RATE_LIMIT_NOTIFICATION_MAX || "60", 10)
);
