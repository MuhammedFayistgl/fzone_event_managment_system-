import mongoose from "mongoose";

const investorImportJobSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["completed", "failed", "rejected"],
      default: "completed",
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "admins", default: null },
    adminEmail: { type: String, default: "" },
    counts: {
      inserted: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    errorCount: { type: Number, default: 0 },
    errors: [
      {
        row: Number,
        field: String,
        message: String,
      },
    ],
  },
  { timestamps: true }
);

investorImportJobSchema.index({ createdAt: -1 });

export default mongoose.model("InvestorImportJob", investorImportJobSchema);
