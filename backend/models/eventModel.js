import mongoose from "mongoose";

// ================= EVENT DAY =================
const eventDaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

// ================= MAIN EVENT =================
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },

    description: {
      type: String,
      required: true,
      minlength: 10
    },

    // ================= REGISTRATION =================
    registrationStart: {
      type: Date,
      default: null,
    },

    registrationDeadline: {
      type: Date,
      default: null,
    },
    // ================= REGISTRATION CONTROL =================
    isRegistrationClosed: {
      type: Boolean,
      default: false
    },
    // ================= EVENT DAYS =================
    eventDays: {
      type: [eventDaySchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one event day required"
      }
    },

    // ================= PARTICIPATION =================
    maxParticipants: {
      type: Number,
      default: 0
    },

    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxPerUser: {
      type: Number,
      required: true,
      min: 1
    },

    // ================= PAYMENT =================
    isPaid: {
      type: Boolean,
      required: true
    },

    price: {
      type: Number,
      default: 0
    },

    investorIsFree: { type: Boolean, default: false },
    investorPrice: { type: Number, default: 0 },
    guestPaymentEnabled: { type: Boolean, default: false },
    guestPrice: { type: Number, default: 0 },
    freeGuestCount: { type: Number, default: 0, min: 0 },

    isRefundable: {
      type: Boolean,
      default: false
    },

    // ================= GUEST =================
    allowGuests: {
      type: Boolean,
      default: false
    },

    // ================= LOCATION =================
    locationType: {
      type: String,
      enum: ["online", "offline"],
      required: true
    },

    location: {
      type: String,
      required: true
    },

    // ================= TICKET DESIGN =================
    ticketDesign: {
      mode: {
        type: String,
        enum: ["default", "custom"],
        default: "default",
      },
      backgroundUrl: { type: String, default: null },
      textTheme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark",
      },
      uploadedAt: { type: Date, default: null },
      originalFileName: { type: String, default: null },
    },

    // ================= META =================
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);