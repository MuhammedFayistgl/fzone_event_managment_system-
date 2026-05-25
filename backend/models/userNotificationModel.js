import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ["admin", "pass_user"],
      required: true,
      index: true,
    },
    recipientId: { type: String, required: true, index: true },
    role: { type: String, default: "" },
    readAt: { type: Date, default: null, index: true },
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    pinned: { type: Boolean, default: false },
    actionTaken: { type: String, default: "" },
    deliveredAt: { type: Date, default: () => new Date() },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userNotificationSchema.index(
  { recipientType: 1, recipientId: 1, readAt: 1, createdAt: -1 }
);
userNotificationSchema.index(
  { recipientType: 1, recipientId: 1, deletedAt: 1, createdAt: -1 }
);
userNotificationSchema.index(
  { notificationId: 1, recipientId: 1 },
  { unique: true }
);

export default mongoose.model("UserNotification", userNotificationSchema);
