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

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      default: "created",
      index: true,
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
    },

    refundedAt: {
      type: Date,
    },

    // ================= LIFECYCLE =================
    paidAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
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
paymentSchema.index({ status: 1 });

// 🔍 latest payments
paymentSchema.index({ createdAt: -1 });

// 🔍 prevent abuse / analytics
paymentSchema.index({ phone: 1, createdAt: -1 });

// ================= EXPORT =================
const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;