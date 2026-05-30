export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: "faq" | "ai" | "fallback";
};

export type AssistantPage = "register" | "portal";

export function browserPrefersMalayalam() {
  const lang = navigator.language?.toLowerCase() || "";
  return lang.startsWith("ml");
}

export function detectPage(pathname: string): AssistantPage {
  return pathname.startsWith("/portal/") ? "portal" : "register";
}
