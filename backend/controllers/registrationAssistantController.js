import {
  getAssistantConfig,
  processAssistantChat,
  getAssistantLogs,
  getAssistantSummary,
} from "../services/registrationAssistantService.js";

export const getAssistantConfigHandler = async (req, res) => {
  try {
    const acceptLanguage = req.headers["accept-language"] || "";
    const config = await getAssistantConfig({ acceptLanguage });
    return res.json({ success: true, data: config });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postAssistantChatHandler = async (req, res) => {
  try {
    const { eventId, message, sessionId, page, phoneVerified } = req.body || {};
    const result = await processAssistantChat({
      eventId,
      message,
      sessionId,
      page,
      phoneVerified,
      ip: req.ip,
    });

    return res.json({
      success: result.success,
      reply: result.reply,
      source: result.source,
      language: result.language,
      sessionId: result.sessionId,
    });
  } catch (err) {
    console.error("[assistant] chat error:", err);
    return res.json({
      success: true,
      reply:
        "Sorry, something went wrong. Please try again or contact event support.",
      source: "fallback",
      language: "en",
    });
  }
};

export const getAssistantLogsHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const { eventId } = req.query;
    const data = await getAssistantLogs({ page, limit, eventId });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAssistantSummaryHandler = async (_req, res) => {
  try {
    const data = await getAssistantSummary();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
