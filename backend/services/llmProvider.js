const PROVIDER = (process.env.ASSISTANT_AI_PROVIDER || "gemini").toLowerCase();
const TIMEOUT_MS = 5000;

function getProvider() {
  if (PROVIDER === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function buildSystemPrompt(eventContext, language) {
  const langLabel = language === "ml" ? "Malayalam" : "English";
  const ctxJson = eventContext ? JSON.stringify(eventContext, null, 0) : "{}";

  return [
    `You are F-Zone event registration assistant. Reply ONLY in ${langLabel}. Never switch languages.`,
    "Help with event registration, payment (Razorpay), guests, QR passes, and gate check-in only.",
    "Do not give legal, medical, or unrelated advice. Do not invent prices or policies not in context.",
    "If unsure, tell the user to contact event support.",
    `Event context (no PII): ${ctxJson}`,
  ].join("\n");
}

async function callGemini(systemPrompt, userMessage) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Empty Gemini response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(systemPrompt, userMessage) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty OpenAI response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export function isLlmAvailable() {
  return Boolean(getProvider());
}

export async function generateAssistantReply({ message, eventContext, language }) {
  const provider = getProvider();
  if (!provider) return null;

  const systemPrompt = buildSystemPrompt(eventContext, language);

  try {
    if (provider === "openai") {
      return { reply: await callOpenAI(systemPrompt, message), provider: "openai" };
    }
    return { reply: await callGemini(systemPrompt, message), provider: "gemini" };
  } catch (err) {
    console.error("[assistant] LLM error:", err.message);
    return null;
  }
}
