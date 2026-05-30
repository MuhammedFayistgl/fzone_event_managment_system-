import { REGISTRATION_FAQ } from "../data/registrationFaq.js";
import { detectLanguage, pickBilingual } from "../utils/detectLanguage.js";

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s\u0D00-\u0D7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text) {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function scoreEntry(message, entry, language) {
  const norm = normalize(message);
  const msgTokens = tokenSet(message);
  const keywords =
    language === "ml"
      ? [...entry.keywordsMl, ...entry.keywordsEn]
      : [...entry.keywordsEn, ...entry.keywordsMl];
  const question = language === "ml" ? entry.questionMl : entry.questionEn;
  const altQuestion = language === "ml" ? entry.questionEn : entry.questionMl;

  let keywordHits = 0;
  for (const kw of keywords) {
    const kwNorm = normalize(kw);
    if (kwNorm.length >= 2 && (msgTokens.has(kwNorm) || norm.includes(kwNorm))) {
      keywordHits += 1;
    }
  }

  const keywordScore = Math.min(1, keywordHits / Math.max(2, keywords.length * 0.3));

  const questionOverlap = (q) => {
    const qTokens = tokenSet(q);
    if (!msgTokens.size || !qTokens.size) return 0;
    let overlap = 0;
    for (const t of msgTokens) {
      if (qTokens.has(t)) overlap += 1;
    }
    return overlap / Math.max(msgTokens.size, qTokens.size);
  };

  const questionScore = Math.max(questionOverlap(question), questionOverlap(altQuestion) * 0.9);
  return keywordScore * 0.55 + questionScore * 0.45;
}

export function matchFaq(message, eventContext = null) {
  const language = detectLanguage(message);
  let best = null;
  let bestScore = 0;

  for (const entry of REGISTRATION_FAQ) {
    const primary = scoreEntry(message, entry, language);
    const secondary = scoreEntry(message, entry, language === "ml" ? "en" : "ml");
    let score = primary * 0.75 + secondary * 0.25;

    if (entry.id === "guest_rules" && eventContext?.allowGuests === false) {
      if (score >= 0.35) score = Math.max(score, 0.8);
    }
    if (entry.id === "registration_closed" && eventContext?.isRegistrationClosed) {
      if (score >= 0.3) score = Math.max(score, 0.85);
    }
    if (entry.id === "free_event" && eventContext?.isPaid === false) {
      if (score >= 0.3) score = Math.max(score, 0.75);
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore < 0.55) return null;

  let answer = pickBilingual(language, best.answerEn, best.answerMl);
  answer = injectEventContext(answer, eventContext, language);

  return {
    language,
    answer,
    faqId: best.id,
    confidence: bestScore,
  };
}

function injectEventContext(answer, ctx, language) {
  if (!ctx) return answer;

  const extras = [];
  if (ctx.title) {
    extras.push(
      language === "ml" ? `ഇവന്റ്: ${ctx.title}` : `Event: ${ctx.title}`
    );
  }
  if (ctx.pricingSummary) {
    extras.push(
      language === "ml" ? `പ്രൈസ്: ${ctx.pricingSummary}` : `Pricing: ${ctx.pricingSummary}`
    );
  }
  if (ctx.allowGuests === false) {
    extras.push(
      language === "ml"
        ? "ഈ ഇവന്റിൽ guests അനുവദിച്ചിട്ടില്ല."
        : "Guests are not allowed for this event."
    );
  } else if (ctx.allowGuests && ctx.maxPerUser) {
    extras.push(
      language === "ml"
        ? `അനുവദിച്ച guest limit: ${ctx.maxPerUser}`
        : `Guest limit per registration: ${ctx.maxPerUser}`
    );
  }
  if (ctx.isRegistrationClosed) {
    extras.push(
      language === "ml"
        ? "Registration ഇപ്പോൾ close ആണ്."
        : "Registration is currently closed."
    );
  }

  if (!extras.length) return answer;
  return `${answer}\n\n${extras.join("\n")}`;
}

export function getFallbackMessage(language, support = {}) {
  const contact =
    support.supportPhone || support.supportEmail
      ? language === "ml"
        ? `Support: ${support.supportPhone || ""} ${support.supportEmail || ""}`.trim()
        : `Support: ${support.supportPhone || ""} ${support.supportEmail || ""}`.trim()
      : "";

  const base =
    language === "ml"
      ? "കൃത്യമായ ഉത്തരം കണ്ടെത്താൻ കഴിഞ്ഞില്ല. ചോദ്യം വ്യത്യസ്തമായി ചോദിക്കുക."
      : "I couldn't find an exact answer. Please try rephrasing your question.";

  return contact ? `${base}\n${contact}` : base;
}
