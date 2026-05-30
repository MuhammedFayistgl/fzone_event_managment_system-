import { browserPrefersMalayalam } from "../store/assistantStore";

const CHIPS_EN = [
  "How do I register?",
  "How do I pay?",
  "Can I add guests?",
  "Where is my QR pass?",
];

const CHIPS_ML = [
  "എങ്ങനെ register ചെയ്യാം?",
  "payment എങ്ങനെ?",
  "guest ചേർക്കാമോ?",
  "QR pass എവിടെ?",
];

type Props = {
  onPick: (text: string) => void;
  visible: boolean;
};

export default function AssistantQuickChips({ onPick, visible }: Props) {
  if (!visible) return null;
  const chips = browserPrefersMalayalam() ? CHIPS_ML : CHIPS_EN;

  return (
    <div className="reg-assistant-chips">
      {chips.map((chip) => (
        <button key={chip} type="button" onClick={() => onPick(chip)}>
          {chip}
        </button>
      ))}
    </div>
  );
}
