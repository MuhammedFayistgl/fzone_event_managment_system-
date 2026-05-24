import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import logger from "morgan";
import cookieParser from "cookie-parser";
import indexRouter from "./router/indexRouter.js";
import adminRouter from "./router/adminRouter.js";
import userRouter from "./router/userRouter.js";
import { razorpayWebhook } from "./controllers/paymentController.js";
import { ConnectionDB } from "./server/server.js";
import cors from "cors";
import { startPaymentCleanupJob } from "./utils/crone.js";
import authMiddleware from "./middleware/authMiddleware.js";
import { requireRole } from "./middleware/roleMiddleware.js";
import { closeRegistration } from "./controllers/registrationController.js";
import { ensureTicketBgDir } from "./utils/ticketBackground.js";
import { initLiveHub } from "./live/liveHub.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set("trust proxy", 1);

const isDev = process.env.NODE_ENV !== "production";

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.1.73:5173",
  "http://192.168.1.89:5173",
];

const corsAllowList = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

/** Dev: allow any LAN IP on Vite ports so mobile/laptop both work without editing .env */
const isAllowedDevOrigin = (origin) => {
  if (!isDev) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin
  );
};

const adminAuthEnabled = () => process.env.REQUIRE_ADMIN_AUTH !== "false";
const legacyCloseProtect = adminAuthEnabled()
  ? [authMiddleware, requireRole("admin")]
  : [];

// ================= MIDDLEWARE =================
app.use(logger("dev"));
app.post(
  "/user/razorpay-webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (corsAllowList.includes(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }
      console.warn("CORS blocked origin:", origin);
      return callback(new Error(`CORS not allowed: ${origin}`));
    },
  })
);

// Static uploads (ticket backgrounds)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);

// Legacy close-registration path (backward compatible with existing frontend)
app.post(
  "/event/:id/close-registration",
  ...legacyCloseProtect,
  closeRegistration
);

// ================= SERVER START =================
ConnectionDB()
  .then(async () => {
    console.log("DB connected ✅");
    await ensureTicketBgDir();
    startPaymentCleanupJob();

    const port = process.env.PORT || 8000;
    const httpServer = http.createServer(app);
    initLiveHub(httpServer, { corsAllowList, isAllowedDevOrigin });

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Node server running on port ${port}`);
      if (isDev) {
        console.log("CORS dev: localhost + 192.168.x.x origins allowed");
      }
      console.log("Live sync: Socket.io enabled");
    });
  })
  .catch((err) => {
    console.error("DB connection failed ❌", err);
  });
