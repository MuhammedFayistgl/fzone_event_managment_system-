import mongoose from "mongoose";

const webhookDeliverySchema = new mongoose.Schema(
  {
    provider: { type: String, default: "razorpay", index: true },
    eventType: { type: String, required: true, index: true },
    entityId: { type: String, default: "", index: true },
    status: {
      type: String,
      enum: ["received", "processed", "failed", "ignored"],
      default: "received",
      index: true,
    },
    httpStatus: { type: Number, default: null },
    errorMessage: { type: String, default: "" },
    payloadSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

webhookDeliverySchema.index({ createdAt: -1 });

export default mongoose.model("WebhookDelivery", webhookDeliverySchema);
