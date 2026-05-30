import cron from "node-cron";
import { snapshotUsageMetric } from "../services/platformOpsService.js";
import { ensureSubscriptionPlansSeeded } from "../services/platformBillingService.js";

export function startUsageMetricsJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await snapshotUsageMetric();
    } catch (err) {
      console.error("Usage metrics snapshot failed:", err.message);
    }
  });

  void ensureSubscriptionPlansSeeded().catch((err) => {
    console.warn("Plan seed skipped:", err.message);
  });
}
