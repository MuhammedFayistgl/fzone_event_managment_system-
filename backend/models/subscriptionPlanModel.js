import mongoose from "mongoose";
import { PLAN_TIERS } from "../constants/platformPlans.js";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: PLAN_TIERS,
      required: true,
      unique: true,
      index: true,
    },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    storageBytes: { type: Number, required: true },
    apiRequestsMonth: { type: Number, required: true },
    maxAdmins: { type: Number, required: true },
    bandwidthBytesMonth: { type: Number, required: true },
    priceMonthlyInr: { type: Number, default: 0 },
    priceYearlyInr: { type: Number, default: 0 },
    razorpayPlanIdMonthly: { type: String, default: "" },
    razorpayPlanIdYearly: { type: String, default: "" },
    features: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
