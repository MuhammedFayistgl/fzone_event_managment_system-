import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["admin", "pass_user"],
      required: true,
    },
    recipientId: { type: String, required: true },
    soundEnabled: { type: Boolean, default: true },
    browserPushEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: true },
    doNotDisturb: { type: Boolean, default: false },
    mutedCategories: { type: [String], default: [] },
    dndStart: { type: String, default: "" },
    dndEnd: { type: String, default: "" },
  },
  { timestamps: true }
);

notificationPreferenceSchema.index(
  { recipientType: 1, recipientId: 1 },
  { unique: true }
);

export default mongoose.model("NotificationPreference", notificationPreferenceSchema);
