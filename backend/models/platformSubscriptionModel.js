import mongoose from "mongoose";
import { PLAN_TIERS } from "../constants/platformPlans.js";

const platformSubscriptionSchema = new mongoose.Schema(
  {
    orgKey: { type: String, default: "default", unique: true, index: true },
    tier: { type: String, enum: PLAN_TIERS, default: "free" },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "past_due", "trialing"],
      default: "active",
      index: true,
    },
    billingCycle: { type: String, enum: ["monthly", "yearly", "none"], default: "none" },
    autoRenew: { type: Boolean, default: true },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    razorpaySubscriptionId: { type: String, default: "" },
    razorpayCustomerId: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("PlatformSubscription", platformSubscriptionSchema);
