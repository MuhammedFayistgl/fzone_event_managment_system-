import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "success",
  "warning",
  "error",
  "info",
  "system",
  "security",
  "payment",
  "event",
  "verification",
  "admin",
  "analytics",
  "attendance",
  "ticket",
  "reconciliation",
  "qr",
  "approval",
  "rejection",
];

const NOTIFICATION_CATEGORIES = [
  "registration",
  "payment",
  "checkin",
  "security",
  "finance",
  "system",
  "event",
  "webhook",
];

const PRIORITIES = ["low", "medium", "high", "urgent", "critical"];

const actionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    kind: { type: String, enum: ["link", "api"], default: "link" },
    method: { type: String, default: "GET" },
    url: { type: String, default: "" },
    variant: { type: String, enum: ["primary", "secondary", "danger"], default: "secondary" },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "info", index: true },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      default: "system",
      index: true,
    },
    priority: { type: String, enum: PRIORITIES, default: "medium", index: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    description: { type: String, default: "" },
    sender: {
      actorType: { type: String, default: "system" },
      actorId: { type: String, default: "" },
      actorEmail: { type: String, default: "" },
    },
    audience: {
      mode: { type: String, enum: ["user", "role", "broadcast"], default: "role" },
      roles: { type: [String], default: [] },
      adminIds: { type: [String], default: [] },
    },
    entity: {
      type: { type: String, default: "" },
      id: { type: String, default: "" },
      eventId: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    route: {
      path: { type: String, default: "/" },
      query: { type: mongoose.Schema.Types.Mixed, default: {} },
      hash: { type: String, default: "" },
      openDrawer: { type: String, default: "" },
      highlightId: { type: String, default: "" },
    },
    actions: { type: [actionSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    templateKey: { type: String, default: "" },
    idempotencyKey: { type: String, default: "", index: true },
    expiresAt: { type: Date, default: null },
    delivery: {
      emailQueued: { type: Boolean, default: false },
      pushQueued: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ "entity.eventId": 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

export { NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES, PRIORITIES };
export default mongoose.model("Notification", notificationSchema);
