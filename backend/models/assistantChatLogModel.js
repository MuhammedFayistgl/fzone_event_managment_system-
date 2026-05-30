import mongoose from "mongoose";

const assistantChatLogSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", index: true },
    sessionId: { type: String, index: true },
    language: { type: String, enum: ["en", "ml"], default: "en" },
    userMessage: { type: String, required: true },
    reply: { type: String, required: true },
    source: { type: String, enum: ["faq", "ai", "fallback"], required: true },
    faqId: { type: String, default: null },
    page: { type: String, enum: ["register", "portal"], default: "register" },
  },
  { timestamps: true }
);

assistantChatLogSchema.index({ createdAt: -1 });

export default mongoose.model("AssistantChatLog", assistantChatLogSchema);
