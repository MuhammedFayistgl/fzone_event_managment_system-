import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import AssistantComposer from "./components/AssistantComposer";
import AssistantMessageList from "./components/AssistantMessageList";
import AssistantQuickChips from "./components/AssistantQuickChips";
import { useRegistrationAssistant } from "./hooks/useRegistrationAssistant";
import { browserPrefersMalayalam, detectPage } from "./store/assistantStore";
import "./registration-assistant.css";

function isRazorpayModalOpen() {
  const container = document.querySelector(".razorpay-container");
  if (container instanceof HTMLElement) {
    const rect = container.getBoundingClientRect();
    const style = window.getComputedStyle(container);
    const visible =
      rect.width > 50 &&
      rect.height > 50 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) > 0;
    if (visible) return true;
  }

  const iframe = document.querySelector("iframe[name^='razorpay']");
  if (iframe instanceof HTMLElement) {
    const rect = iframe.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50) return true;
  }

  return false;
}

function usePaymentActive() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => {
      setActive(isRazorpayModalOpen());
    };

    check();
    const id = window.setInterval(check, 500);
    return () => window.clearInterval(id);
  }, []);

  return active;
}

export default function RegistrationAssistantWidget() {
  const { id, eventId: portalEventId } = useParams();
  const location = useLocation();
  const eventId = id || portalEventId || "";
  const page = detectPage(location.pathname);
  const paymentActive = usePaymentActive();

  const { open, setOpen, enabled, messages, loading, sendMessage } =
    useRegistrationAssistant(eventId, page);

  const onPublicRoute =
    location.pathname.startsWith("/event/") ||
    location.pathname.startsWith("/portal/");

  if (!onPublicRoute || !eventId || !enabled) return null;

  const showChips = messages.length <= 1;

  return (
    <div
      className={`reg-assistant-root ${paymentActive ? "reg-assistant-root--hidden" : ""}`}
      aria-hidden={paymentActive}
    >
      {open && (
        <div className="reg-assistant-panel" role="dialog" aria-label="Registration assistant">
          <div className="reg-assistant-header">
            <h3>F-Zone Assistant</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X size={18} />
            </button>
          </div>
          <AssistantMessageList messages={messages} loading={loading} />
          <AssistantQuickChips visible={showChips} onPick={sendMessage} />
          <AssistantComposer
            onSend={sendMessage}
            disabled={loading}
            preferMl={browserPrefersMalayalam()}
          />
          <p className="reg-assistant-footer">Powered by F-Zone Assistant</p>
        </div>
      )}

      <button
        type="button"
        className="reg-assistant-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help chat" : "Open help chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
