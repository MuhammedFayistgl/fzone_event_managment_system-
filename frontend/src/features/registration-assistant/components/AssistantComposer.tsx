import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  preferMl?: boolean;
};

export default function AssistantComposer({ onSend, disabled, preferMl }: Props) {
  const [text, setText] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <form className="reg-assistant-composer" onSubmit={submit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          preferMl
            ? "ചോദ്യം type ചെയ്യുക…"
            : "Type your question…"
        }
        disabled={disabled}
        maxLength={500}
        aria-label="Assistant message"
      />
      <button type="submit" disabled={disabled || !text.trim()} aria-label="Send">
        <Send size={16} />
      </button>
    </form>
  );
}
