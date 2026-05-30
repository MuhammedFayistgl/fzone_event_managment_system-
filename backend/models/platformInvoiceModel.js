import mongoose from "mongoose";

const platformInvoiceSchema = new mongoose.Schema(
  {
    orgKey: { type: String, default: "default", index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    tier: { type: String, default: "free" },
    billingCycle: { type: String, enum: ["monthly", "yearly", "none"], default: "monthly" },
    amountInr: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "failed", "void"],
      default: "open",
      index: true,
    },
    paidAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    razorpayPaymentId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    razorpayInvoiceId: { type: String, default: "" },
    failureReason: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

platformInvoiceSchema.index({ createdAt: -1 });

export default mongoose.model("PlatformInvoice", platformInvoiceSchema);
