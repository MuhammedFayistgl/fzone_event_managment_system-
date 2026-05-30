const MALAYALAM_RE = /[\u0D00-\u0D7F]/g;

export function detectLanguage(text = "") {
  const trimmed = String(text).trim();
  if (!trimmed) return "en";

  const malayalamChars = trimmed.match(MALAYALAM_RE)?.length || 0;
  const ratio = malayalamChars / trimmed.length;
  return ratio >= 0.15 ? "ml" : "en";
}

export function pickBilingual(language, enText, mlText) {
  return language === "ml" ? mlText : enText;
}
