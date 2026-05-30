import { randomUUID } from "crypto";
import AssistantChatLog from "../models/assistantChatLogModel.js";
import { getOrgSettings } from "../utils/appSettings.js";
import { detectLanguage, pickBilingual } from "../utils/detectLanguage.js";
import { buildEventContext } from "./eventContextBuilder.js";
import { matchFaq, getFallbackMessage } from "./faqMatcher.js";
import { generateAssistantReply, isLlmAvailable } from "./llmProvider.js";
import { DEFAULT_ASSISTANT } from "../constants/registrationAssistant.js";

const DEFAULT_ASSISTANT_SETTINGS = DEFAULT_ASSISTANT;

function startOfUtcDay() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function getAssistantSettings() {
  const settings = await getOrgSettings();
  const ra = settings.registrationAssistant || {};
  const merged = { ...DEFAULT_ASSISTANT_SETTINGS, ...ra };

  const hasKey = isLlmAvailable();
  if (hasKey && merged.aiEnabled !== false) {
    merged.aiEnabled = true;
  } else if (!hasKey) {
    merged.aiEnabled = false;
  }

  const envCap = parseInt(process.env.ASSISTANT_DAILY_CAP || "", 10);
  if (!Number.isNaN(envCap) && envCap > 0) {
    merged.dailyAiMessageCap = envCap;
  }

  return merged;
}

async function countTodayAiMessages() {
  const since = startOfUtcDay();
  return AssistantChatLog.countDocuments({ source: "ai", createdAt: { $gte: since } });
}

async function logChat(entry) {
  try {
    await AssistantChatLog.create(entry);
  } catch (err) {
    console.error("[assistant] log error:", err.message);
  }
}

function resolveWelcome(settings, acceptLanguage = "") {
  const preferMl = String(acceptLanguage).toLowerCase().includes("ml");
  return pickBilingual(
    preferMl ? "ml" : "en",
    settings.welcomeMessageEn,
    settings.welcomeMessageMl
  );
}

export async function getAssistantConfig({ acceptLanguage } = {}) {
  const settings = await getAssistantSettings();
  return {
    enabled: Boolean(settings.enabled),
    aiEnabled: Boolean(settings.aiEnabled),
    welcomeMessage: resolveWelcome(settings, acceptLanguage),
    welcomeMessageEn: settings.welcomeMessageEn,
    welcomeMessageMl: settings.welcomeMessageMl,
    supportPhone: settings.supportPhone || "",
    supportEmail: settings.supportEmail || "",
  };
}

export async function processAssistantChat({
  eventId,
  message,
  sessionId,
  page = "register",
  phoneVerified = false,
  ip = "",
}) {
  const settings = await getAssistantSettings();
  if (!settings.enabled) {
    return {
      success: false,
      reply: "Registration assistant is currently disabled.",
      source: "fallback",
      language: "en",
    };
  }

  const trimmed = String(message || "").trim();
  if (!trimmed || trimmed.length > 2000) {
    return {
      success: false,
      reply: "Please enter a valid question.",
      source: "fallback",
      language: "en",
    };
  }

  const language = detectLanguage(trimmed);
  const eventContext = await buildEventContext(eventId);
  const sid = sessionId || randomUUID();

  const faqHit = matchFaq(trimmed, eventContext);
  if (faqHit) {
    const reply = faqHit.answer;
    await logChat({
      eventId: eventContext?.eventId || eventId,
      sessionId: sid,
      language: faqHit.language,
      userMessage: trimmed,
      reply,
      source: "faq",
      faqId: faqHit.faqId,
      page,
    });

    return {
      success: true,
      reply,
      source: "faq",
      language: faqHit.language,
      sessionId: sid,
    };
  }

  let source = "fallback";
  let reply = getFallbackMessage(language, settings);

  const canUseAi =
    settings.aiEnabled &&
    isLlmAvailable() &&
    (await countTodayAiMessages()) < settings.dailyAiMessageCap;

  if (canUseAi) {
    const aiResult = await generateAssistantReply({
      message: trimmed,
      eventContext: { ...eventContext, phoneVerified, page },
      language,
    });

    if (aiResult?.reply) {
      reply = aiResult.reply;
      source = "ai";
    }
  }

  await logChat({
    eventId: eventContext?.eventId || eventId,
    sessionId: sid,
    language,
    userMessage: trimmed,
    reply,
    source,
    page,
  });

  return {
    success: true,
    reply,
    source,
    language,
    sessionId: sid,
  };
}

export async function getAssistantLogs({ page = 1, limit = 50, eventId } = {}) {
  const query = {};
  if (eventId) query.eventId = eventId;

  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    AssistantChatLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AssistantChatLog.countDocuments(query),
  ]);

  return { items, total, page: Math.max(1, page), limit };
}

export async function getAssistantSummary() {
  const since = startOfUtcDay();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, today, week, bySource, topFaq] = await Promise.all([
    AssistantChatLog.countDocuments(),
    AssistantChatLog.countDocuments({ createdAt: { $gte: since } }),
    AssistantChatLog.countDocuments({ createdAt: { $gte: weekAgo } }),
    AssistantChatLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]),
    AssistantChatLog.aggregate([
      { $match: { source: "faq", faqId: { $ne: null }, createdAt: { $gte: weekAgo } } },
      { $group: { _id: "$faqId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const sourceMap = { faq: 0, ai: 0, fallback: 0 };
  for (const row of bySource) {
    sourceMap[row._id] = row.count;
  }

  const weekTotal = sourceMap.faq + sourceMap.ai + sourceMap.fallback;
  const faqMissRate = weekTotal
    ? Math.round(((sourceMap.ai + sourceMap.fallback) / weekTotal) * 100)
    : 0;

  return {
    total,
    today,
    week,
    bySource: sourceMap,
    faqMissRate,
    topFaq: topFaq.map((r) => ({ faqId: r._id, count: r.count })),
    aiToday: await AssistantChatLog.countDocuments({ source: "ai", createdAt: { $gte: since } }),
  };
}

export { DEFAULT_ASSISTANT } from "../constants/registrationAssistant.js";
