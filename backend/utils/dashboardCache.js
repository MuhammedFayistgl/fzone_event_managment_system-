import redisClient from "../config/redis.js";
import { emitDashboardUpdated } from "../live/liveHub.js";

const DASHBOARD_CACHE_KEYS = [
  "dashboard:summary:v2",
  "dashboard:summary:v3",
  "dashboard:summary:v4",
  "dashboard:summary:v5",
];

export async function clearDashboardCache() {
  try {
    for (const key of DASHBOARD_CACHE_KEYS) {
      await redisClient.del(key);
    }
  } catch (err) {
    console.log("Dashboard cache clear error:", err);
  }
}

export async function notifyDashboardMetricsChanged() {
  await clearDashboardCache();
  emitDashboardUpdated();
}
