import type { AssistantMessage } from "../store/assistantStore";

type Props = {
  messages: AssistantMessage[];
  loading: boolean;
};

export default function AssistantMessageList({ messages, loading }: Props) {
  return (
    <div className="reg-assistant-messages" role="log" aria-live="polite">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`reg-assistant-msg reg-assistant-msg--${msg.role}`}
        >
          <p>{msg.text}</p>
          {msg.role === "assistant" && msg.source && msg.source !== "faq" && (
            <span className="reg-assistant-msg__meta">{msg.source}</span>
          )}
        </div>
      ))}
      {loading && (
        <div className="reg-assistant-msg reg-assistant-msg--assistant reg-assistant-typing">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
