import mongoose from "mongoose";

const orgSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    refundAccessPolicy: {
      type: String,
      enum: ["active_refunds", "processed_only"],
      default: "active_refunds",
    },
    gateNames: {
      type: [String],
      default: ["Main Gate", "VIP Gate", "Side Gate"],
    },
    notifications: {
      emailEnabled: { type: Boolean, default: false },
      smsEnabled: { type: Boolean, default: false },
      smtpHost: { type: String, default: "" },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: "" },
      smtpPass: { type: String, default: "" },
      smtpFrom: { type: String, default: "" },
      twilioAccountSid: { type: String, default: "" },
      twilioAuthToken: { type: String, default: "" },
      twilioFromNumber: { type: String, default: "" },
    },
    waitlistEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("OrgSettings", orgSettingsSchema);
