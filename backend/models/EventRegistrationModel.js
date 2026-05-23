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

    participants: [
      {
        name: { type: String, required: true },
        phone: { type: String }, // ✅ add this
        type: { type: String, default: "guest" },
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

    }
  },
  { timestamps: true }
);

const RegEventModel = mongoose.model("registrations", registrationSchema);

export default RegEventModel