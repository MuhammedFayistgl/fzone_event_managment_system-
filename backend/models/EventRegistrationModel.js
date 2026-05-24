import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "investors",
      required: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      index: true,
    },

    investorName: {
      type: String,
      trim: true,
      default: "",
    },

    investorCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    participants: [
      {
        name: { type: String, required: true },
        phone: { type: String },
        type: { type: String, default: "guest" },
        gender: {
          type: String,
          enum: ["Male", "Female", "Other"],
          default: "Other",
        },
        qrToken: { type: String },
        qrCodeImage: String,
        isCheckedIn: { type: Boolean, default: false },
        checkedInAt: { type: Date, default: null },
        isBlocked: { type: Boolean, default: false },
        blockedAt: { type: Date, default: null },
        blockedReason: { type: String, default: "", trim: true },
      },
    ],
    qrToken: { type: String, index: true },
    qrCodeImage: String,
    isCheckedIn: { type: Boolean, default: false },



    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    checkInDevice: {
      type: String,
      default: "",
    },

    gateName: {
      type: String,
      default: "",

    },

    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    blockedReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ "participants.qrToken": 1 });

const RegEventModel = mongoose.model("registrations", registrationSchema);

export default RegEventModel