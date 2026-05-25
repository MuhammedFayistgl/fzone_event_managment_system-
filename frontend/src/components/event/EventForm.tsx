import { ProPickerProvider } from "./ProDateTimePickers";
import EventFormWizard from "./EventFormWizard";

type Props = {
  errors: Record<string, any>;
  formResetKey?: number;
  loading?: boolean;
  editEventId?: string | null;
  targetStepIndex?: number | null;
  onStepSynced?: () => void;
  onSubmit: () => void;
  onClear: () => void;
  onCancelEdit: () => void;
};

export default function EventForm(props: Props) {
  return (
    <ProPickerProvider>
      <EventFormWizard {...props} />
    </ProPickerProvider>
  );
}
