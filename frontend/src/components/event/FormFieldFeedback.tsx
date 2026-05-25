import type { FieldFeedback } from "../../utils/eventFormValidation";

type Props = {
  feedback?: FieldFeedback;
  /** Submit-time error takes priority over live feedback */
  error?: string;
};

export default function FormFieldFeedback({ feedback, error }: Props) {
  const message = error || feedback?.message;
  if (!message) return null;

  const status = error ? "error" : feedback?.status ?? "info";

  return (
    <p className={`event-form-feedback event-form-feedback--${status}`} role={status === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
}
