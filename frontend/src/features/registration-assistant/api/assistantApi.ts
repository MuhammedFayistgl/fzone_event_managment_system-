import axios from "axios";
import { resolveBaseURL } from "../../../api/axios";

const baseURL = resolveBaseURL();

export type AssistantConfig = {
  enabled: boolean;
  aiEnabled: boolean;
  welcomeMessage: string;
  welcomeMessageEn: string;
  welcomeMessageMl: string;
  supportPhone: string;
  supportEmail: string;
};

export type ChatResponse = {
  success: boolean;
  reply: string;
  source: "faq" | "ai" | "fallback";
  language: "en" | "ml";
  sessionId?: string;
};

export async function fetchAssistantConfig(eventId: string): Promise<AssistantConfig | null> {
  const res = await axios.get(`${baseURL}/user/assistant/config`, {
    params: { eventId },
  });
  return res.data?.data ?? null;
}

export async function sendAssistantMessage(payload: {
  eventId: string;
  message: string;
  sessionId?: string;
  page?: "register" | "portal";
  phoneVerified?: boolean;
}): Promise<ChatResponse> {
  const res = await axios.post(`${baseURL}/user/assistant/chat`, payload);
  return res.data;
}
