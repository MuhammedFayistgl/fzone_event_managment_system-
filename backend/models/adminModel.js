import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["super_admin", "admin", "scanner", "finance"],
    default: "admin",
  },
  status: {
    type: String,
    enum: ["pending", "active", "disabled"],
    default: "pending",
  },
  permissions: {
    type: [String],
    default: [],
  },
  activatedAt: { type: Date, default: null },
  activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "admin", default: null },
});

export default mongoose.model("admin", adminSchema);
