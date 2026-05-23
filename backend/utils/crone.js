import cron from "node-cron";
import Payment from "../models/paymentModel.js";

export const startPaymentCleanupJob = () => {
    cron.schedule("*/5 * * * *", async () => {
        try {
            console.log("⏱ Checking old payments...");

            const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

            await Payment.updateMany(
                {
                    status: "created",
                    createdAt: { $lt: fifteenMinAgo },
                },
                {
                    status: "failed",
                    failedAt: new Date(),
                }
            );

            console.log("✅ Old payments marked as failed");
        } catch (err) {
            console.error("CRON ERROR:", err);
        }
    });
};