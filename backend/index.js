import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import logger from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
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
import { validateEnv, isProduction } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { getRedisClient, isRedisEnabled } from "./config/redis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  validateEnv();
} catch (err) {
  console.error("Environment validation failed:", err.message);
  process.exit(1);
}

const app = express();
const isDev = !isProduction();

app.set("trust proxy", 1);

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsAllowList = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

const isAllowedDevOrigin = (origin) => {
  if (!isDev) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin
  );
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isDev ? false : undefined,
  })
);

app.use(isDev ? logger("dev") : logger("combined"));

// Before CORS — Render/load balancers hit /health without an Origin header
app.get("/health", async (_req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    redis: "unknown",
    mongo: "connected",
  };

  if (!isRedisEnabled()) {
    health.redis = "disabled";
  } else {
    try {
      const redis = await getRedisClient();
      if (!redis) {
        health.redis = "disconnected";
        health.status = "degraded";
      } else {
        await redis.ping();
        health.redis = "connected";
      }
    } catch {
      health.redis = "disconnected";
      health.status = "degraded";
    }
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

app.post(
  "/user/razorpay-webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        if (isDev) return callback(null, true);
        return callback(new Error("CORS not allowed: missing origin"));
      }
      if (corsAllowList.includes(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }
      console.warn("CORS blocked origin:", origin);
      return callback(new Error(`CORS not allowed: ${origin}`));
    },
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);

app.post(
  "/event/:id/close-registration",
  authMiddleware,
  requireRole("admin"),
  closeRegistration
);

app.use(notFoundHandler);
app.use(errorHandler);

ConnectionDB()
  .then(async () => {
    console.log("DB connected ✅");
    await ensureTicketBgDir();
    startPaymentCleanupJob();

    if (!isRedisEnabled()) {
      console.log("Redis disabled — cache off");
    } else {
      try {
        const redis = await getRedisClient();
        if (redis) {
          console.log("Redis connected ✅");
        } else {
          console.warn("Redis unavailable — cache disabled");
        }
      } catch (err) {
        console.warn("Redis unavailable — cache disabled:", err.message);
      }
    }

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
    process.exit(1);
  });
