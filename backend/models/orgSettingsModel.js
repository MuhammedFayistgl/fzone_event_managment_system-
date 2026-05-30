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
    registrationAssistant: {
      enabled: { type: Boolean, default: true },
      aiEnabled: { type: Boolean, default: false },
      welcomeMessageEn: {
        type: String,
        default:
          "Hi! I'm the F-Zone registration assistant. Ask about registration, payment, guests, or your QR pass.",
      },
      welcomeMessageMl: {
        type: String,
        default:
          "നമസ്കാരം! F-Zone registration assistant ആണ്. registration, payment, guests, QR pass എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.",
      },
      supportPhone: { type: String, default: "" },
      supportEmail: { type: String, default: "" },
      dailyAiMessageCap: { type: Number, default: 200 },
    },
    platform: {
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: { type: String, default: "" },
      plan: {
        type: String,
        enum: ["free", "basic", "pro", "enterprise"],
        default: "free",
      },
      planStatus: {
        type: String,
        enum: ["active", "paused", "cancelled", "past_due", "trialing"],
        default: "active",
      },
      planExpiresAt: { type: Date, default: null },
      autoRenew: { type: Boolean, default: true },
      lastDeploymentAt: { type: Date, default: null },
      usageWarningSentAt: { type: Date, default: null },
      planLimits: {
        storageBytes: { type: Number, default: 524288000 },
        apiRequestsMonth: { type: Number, default: 50000 },
        maxAdmins: { type: Number, default: 3 },
        bandwidthBytesMonth: { type: Number, default: 1073741824 },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("OrgSettings", orgSettingsSchema);
