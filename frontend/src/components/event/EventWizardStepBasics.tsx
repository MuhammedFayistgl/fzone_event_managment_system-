import { Input } from "rsuite";
import { useAppSelector } from "../../hooks/hooks";
import FormFieldFeedback from "./FormFieldFeedback";
import { FieldLabel, useEventFormHandle } from "./eventFormShared";
import { getEventFormFeedback } from "../../utils/eventFormValidation";
import { useMemo } from "react";

type Props = {
  errors: Record<string, any>;
};

export default function EventWizardStepBasics({ errors }: Props) {
  const form = useAppSelector((s) => s.event.form);
  const handle = useEventFormHandle();
  const liveFeedback = useMemo(() => getEventFormFeedback(form), [form]);

  return (
    <div className="event-wizard-step space-y-4">
      <p className="event-wizard-step__intro">
        Start with a clear title and description — this is what attendees see first.
      </p>
      <div>
        <FieldLabel hint="3–80 characters">{`Title (${form.title.length}/80)`}</FieldLabel>
        <Input
          name="title"
          placeholder="Annual Meet 2026"
          value={form.title}
          maxLength={80}
          onChange={(v) => handle("title", v)}
        />
        <FormFieldFeedback error={errors.title} feedback={liveFeedback.title} />
      </div>
      <div>
        <FieldLabel hint="10–500 characters">{`Description (${form.description.length}/500)`}</FieldLabel>
        <Input
          name="description"
          as="textarea"
          rows={4}
          placeholder="Describe your event..."
          value={form.description}
          maxLength={500}
          onChange={(v) => handle("description", v)}
        />
        <FormFieldFeedback error={errors.description} feedback={liveFeedback.description} />
      </div>
    </div>
  );
}
