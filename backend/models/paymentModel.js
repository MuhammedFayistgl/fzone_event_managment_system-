import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // ================= BASIC =================
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ================= RAZORPAY =================
    razorpay_order_id: {
      type: String,
      required: true,
      unique: true, // ✅ order always unique
    },

    razorpay_payment_id: {
      type: String,
      unique: true,
      sparse: true, // ✅ allow multiple null (CRITICAL FIX)
    },

    razorpay_signature: {
      type: String,
    },

    // ================= PAYMENT =================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    guestCount: { type: Number, default: 0, min: 0 },

    breakdown: {
      investorAmount: { type: Number, default: 0 },
      guestAmount: { type: Number, default: 0 },
      guestCount: { type: Number, default: 0 },
      payableGuestCount: { type: Number, default: 0 },
      freeGuestCount: { type: Number, default: 0 },
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      default: "created",
    },

    // ================= OPTIONAL META =================
    method: {
      type: String, // upi, card, netbanking
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // ================= SECURITY =================
    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    // ================= REFUND =================
    refundId: {
      type: String,
    },

    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    refundReason: {
      type: String,
    },

    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    refundedAt: {
      type: Date,
    },

    refunds: [
      {
        refundId: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        reason: { type: String, required: true },
        note: { type: String, default: "" },
        status: {
          type: String,
          enum: ["pending", "processed", "failed"],
          default: "pending",
        },
        razorpayReceipt: { type: String },
        speedRequested: { type: String },
        speedProcessed: { type: String },
        failureReason: { type: String },
        initiatedAt: { type: Date, default: Date.now },
        processedAt: { type: Date },
        refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        refundedAt: { type: Date, default: Date.now },
      },
    ],

    // ================= LIFECYCLE =================
    paidAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
    },

    reconciliationReviewedAt: {
      type: Date,
      default: null,
    },

    reconciliationNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ================= INDEXES =================

// 🔍 fast lookup for user payments
paymentSchema.index({ eventId: 1, phone: 1 });

// 🔍 status filtering (dashboard)
paymentSchema.index({ status: 1, createdAt: -1 });

// 🔍 latest payments
paymentSchema.index({ createdAt: -1 });

// 🔍 prevent abuse / analytics
paymentSchema.index({ phone: 1, createdAt: -1 });

// ================= EXPORT =================
const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;