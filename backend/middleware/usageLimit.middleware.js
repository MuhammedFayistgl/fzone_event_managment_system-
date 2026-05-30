import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getOrgSettings } from "../utils/appSettings.js";
import { getApiUsageCounters } from "./apiUsage.middleware.js";
import { createNotification } from "../services/notificationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "..", "uploads");

async function getUploadsSizeBytes(dir = uploadsRoot) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await getUploadsSizeBytes(full);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        total += stat.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

let lastUsageWarningAt = 0;

async function maybeNotifyUsageThreshold(used, limit, metric) {
  if (!limit || limit <= 0) return;
  const ratio = used / limit;
  if (ratio < 0.8) return;
  const now = Date.now();
  if (now - lastUsageWarningAt < 60 * 60 * 1000) return;
  lastUsageWarningAt = now;
  createNotification("platform.usage_warning", {
    metric,
    used,
    limit,
    percent: Math.round(ratio * 100),
  }).catch(() => {});
}

export async function checkStorageLimit() {
  const settings = await getOrgSettings();
  const platform = settings.platform || {};
  const limits = platform.planLimits || {};
  const used = await getUploadsSizeBytes();
  const limit = limits.storageBytes || 0;

  if (limit > 0 && used >= limit) {
    await maybeNotifyUsageThreshold(used, limit, "storage");
    const err = new Error("Storage limit exceeded for your plan");
    err.statusCode = 403;
    err.code = "USAGE_LIMIT_EXCEEDED";
    err.details = { metric: "storage", used, limit };
    throw err;
  }

  if (limit > 0 && used >= limit * 0.8) {
    await maybeNotifyUsageThreshold(used, limit, "storage");
  }

  return { used, limit };
}

export async function checkApiLimit() {
  const settings = await getOrgSettings();
  const platform = settings.platform || {};
  const limits = platform.planLimits || {};
  const { apiRequestsMonth } = getApiUsageCounters();
  const limit = limits.apiRequestsMonth || 0;

  if (limit > 0 && apiRequestsMonth >= limit) {
    await maybeNotifyUsageThreshold(apiRequestsMonth, limit, "apiRequests");
    const err = new Error("Monthly API request limit exceeded");
    err.statusCode = 403;
    err.code = "USAGE_LIMIT_EXCEEDED";
    err.details = { metric: "apiRequests", used: apiRequestsMonth, limit };
    throw err;
  }

  return { used: apiRequestsMonth, limit };
}

export function usageLimitGuard(type = "api") {
  return async (_req, _res, next) => {
    try {
      if (type === "storage") {
        await checkStorageLimit();
      } else {
        await checkApiLimit();
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function getStorageUsageSnapshot() {
  const used = await getUploadsSizeBytes();
  const settings = await getOrgSettings();
  const limit = settings.platform?.planLimits?.storageBytes || 0;
  return { used, limit };
}

export { getUploadsSizeBytes };
