import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    phone: { type: String, required: true, index: true },
    investorName: { type: String, default: "" },
    guestCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["waiting", "invited", "registered", "cancelled"],
      default: "waiting",
      index: true,
    },
  },
  { timestamps: true }
);

waitlistSchema.index({ eventId: 1, phone: 1 }, { unique: true });

export default mongoose.model("WaitlistEntry", waitlistSchema);
