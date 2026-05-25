/**
 * Generate Render production env file from local backend/.env (gitignored output).
 *
 * Usage (from backend/):
 *   node scripts/generateRenderEnv.js
 *   node scripts/generateRenderEnv.js --cors=https://your-app.vercel.app
 */
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
const outPath = path.join(__dirname, "..", ".env.render.local");

dotenv.config({ path: envPath });

const corsArg = process.argv.find((a) => a.startsWith("--cors="));
const corsOrigins =
  corsArg?.slice("--cors=".length) ||
  process.env.CORS_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter((o) => o.startsWith("https://"))
    .join(",") ||
  "https://YOUR-APP.vercel.app";

function secret(len = 48) {
  return crypto.randomBytes(len).toString("base64url");
}

const mongo = process.env.MONGODB_SERVER_IP?.trim();
if (!mongo || mongo.includes("127.0.0.1")) {
  console.error("Set MONGODB_SERVER_IP in backend/.env to your Atlas URI first.");
  process.exit(1);
}

const access =
  process.env.ACCESS_SECRET?.includes("change-me") ||
  process.env.ACCESS_SECRET?.includes("your_")
    ? secret()
    : process.env.ACCESS_SECRET;
const refresh =
  process.env.REFRESH_SECRET?.includes("change-me") ||
  process.env.REFRESH_SECRET?.includes("your_")
    ? secret()
    : process.env.REFRESH_SECRET;

const lines = [
  "# Auto-generated — copy ALL keys to Render → Environment (do not commit)",
  "NODE_ENV=production",
  "PORT=10000",
  `MONGODB_SERVER_IP=${mongo}`,
  process.env.REDIS_URL?.includes("upstash")
    ? `REDIS_URL=${process.env.REDIS_URL}`
    : "# REDIS_URL=rediss://... (optional — add Upstash URL)",
  `ACCESS_SECRET=${access}`,
  `REFRESH_SECRET=${refresh}`,
  `CORS_ORIGINS=${corsOrigins}`,
  `RAZORPAY_KEY_ID=${process.env.RAZORPAY_KEY_ID || ""}`,
  `RAZORPAY_KEY_SECRET=${process.env.RAZORPAY_KEY_SECRET || ""}`,
  `RAZORPAY_WEBHOOK_SECRET=${process.env.RAZORPAY_WEBHOOK_SECRET || "render-webhook-placeholder-change-later"}`,
  "REQUIRE_ADMIN_AUTH=true",
  "ALLOW_ADMIN_SIGNUP=false",
  "RATE_LIMIT_ENABLED=true",
];

fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${outPath}`);
console.log("Copy every line (except comments) into Render → Environment.");
