import { redisDel, redisDeleteByPattern } from "../config/redis.js";
import { emitDashboardUpdated } from "../live/liveHub.js";

const DASHBOARD_CACHE_KEYS = [
  "dashboard:summary:v2",
  "dashboard:summary:v3",
  "dashboard:summary:v4",
  "dashboard:summary:v5",
];

export async function clearDashboardCache() {
  try {
    await redisDel(DASHBOARD_CACHE_KEYS);
  } catch (err) {
    console.log("Dashboard cache clear error:", err);
  }
}

export async function notifyDashboardMetricsChanged() {
  await clearDashboardCache();
  emitDashboardUpdated();
}

export async function clearInvestorListCache() {
  try {
    await redisDeleteByPattern("investors:*");
    await clearDashboardCache();
  } catch (err) {
    console.log("Investor cache clear error:", err);
  }
}
