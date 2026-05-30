import mongoose from "mongoose";

const serverLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error", "critical"],
      default: "info",
      index: true,
    },
    source: { type: String, default: "platform", index: true },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

serverLogSchema.index({ createdAt: -1 });

export default mongoose.model("ServerLog", serverLogSchema);
