import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAssistantConfig, sendAssistantMessage } from "../api/assistantApi";
import type { AssistantMessage, AssistantPage } from "../store/assistantStore";
import { browserPrefersMalayalam } from "../store/assistantStore";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useRegistrationAssistant(eventId: string, page: AssistantPage) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    fetchAssistantConfig(eventId)
      .then((cfg) => {
        if (cancelled || !cfg) return;
        setEnabled(Boolean(cfg.enabled));
        const welcome =
          browserPrefersMalayalam() && cfg.welcomeMessageMl
            ? cfg.welcomeMessageMl
            : cfg.welcomeMessage || cfg.welcomeMessageEn;
        setWelcomeMessage(welcome);
        setInitialized(true);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const seedWelcome = useCallback(() => {
    if (!welcomeMessage) return;
    setMessages((prev) => {
      if (prev.length) return prev;
      return [{ id: uid(), role: "assistant", text: welcomeMessage }];
    });
  }, [welcomeMessage]);

  useEffect(() => {
    if (open) seedWelcome();
  }, [open, seedWelcome]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !eventId || loading) return;

      setMessages((prev) => [...prev, { id: uid(), role: "user", text: trimmed }]);
      setLoading(true);

      try {
        const res = await sendAssistantMessage({
          eventId,
          message: trimmed,
          sessionId,
          page,
        });

        if (res.sessionId) setSessionId(res.sessionId);

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            text: res.reply,
            source: res.source,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            text: browserPrefersMalayalam()
              ? "ക്ഷമിക്കണം, ഇപ്പോൾ connect ചെയ്യാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക."
              : "Sorry, I could not connect right now. Please try again.",
            source: "fallback",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [eventId, loading, page, sessionId]
  );

  return useMemo(
    () => ({
      open,
      setOpen,
      enabled: enabled && initialized,
      messages,
      loading,
      sendMessage,
    }),
    [open, enabled, initialized, messages, loading, sendMessage]
  );
}
