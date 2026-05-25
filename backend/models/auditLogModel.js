import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ["refund", "block", "export", "payment", "registration", "settings", "webhook", "auth"],
      default: "registration",
      index: true,
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "admin", default: null },
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    phone: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ eventId: 1, createdAt: -1 });
auditLogSchema.index({ actorEmail: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
