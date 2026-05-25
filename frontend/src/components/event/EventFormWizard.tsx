import { useEffect, useRef } from "react";
import { Button } from "rsuite";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventFormPreview from "./EventFormPreview";
import EventWizardStepBasics from "./EventWizardStepBasics";
import EventWizardStepDetails from "./EventWizardStepDetails";
import EventWizardStepSchedule from "./EventWizardStepSchedule";
import EventWizardStepTicket from "./EventWizardStepTicket";
import { useEventScheduleState } from "./eventFormShared";
import { useEventWizard } from "./useEventWizard";
import type { EventWizardStepId } from "./eventWizardConfig";

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

function StepPanel({
  stepId,
  errors,
  schedule,
}: {
  stepId: EventWizardStepId;
  errors: Record<string, any>;
  schedule: ReturnType<typeof useEventScheduleState>;
}) {
  switch (stepId) {
    case "basics":
      return <EventWizardStepBasics errors={errors} />;
    case "details":
      return <EventWizardStepDetails errors={errors} />;
    case "schedule":
      return (
        <EventWizardStepSchedule
          errors={errors}
          eventDays={schedule.eventDays}
          onAddDay={schedule.addDay}
          onRemoveDay={schedule.removeDay}
          onUpdateDay={schedule.updateDay}
        />
      );
    case "ticket":
      return <EventWizardStepTicket />;
    default:
      return null;
  }
}

export default function EventFormWizard({
  errors,
  formResetKey = 0,
  loading = false,
  editEventId = null,
  targetStepIndex = null,
  onStepSynced,
  onSubmit,
  onClear,
  onCancelEdit,
}: Props) {
  const schedule = useEventScheduleState(formResetKey);
  const wizard = useEventWizard(0);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    slideRef.current?.scrollTo(0, 0);
  }, [wizard.stepId]);

  useEffect(() => {
    if (formResetKey > 0) {
      wizard.resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formResetKey]);

  useEffect(() => {
    if (targetStepIndex != null && targetStepIndex >= 0) {
      wizard.goToStep(targetStepIndex);
      onStepSynced?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetStepIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !wizard.isFirst) {
        e.preventDefault();
        wizard.goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wizard]);

  const handlePrimary = () => {
    if (wizard.isLast) {
      if (wizard.validateCurrentStep()) {
        onSubmit();
      }
    } else {
      wizard.goNext();
    }
  };

  return (
    <div className="event-wizard">
      <ol className="event-wizard__stepper" aria-label="Event form steps">
        {wizard.steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === wizard.stepIndex;
          const isDone = i < wizard.stepIndex;
          return (
            <li key={step.id} className="event-wizard__step-item">
              <button
                type="button"
                className={[
                  "event-wizard__step",
                  isActive ? "event-wizard__step--active" : "",
                  isDone ? "event-wizard__step--done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "step" : undefined}
                onClick={() => {
                  if (i < wizard.stepIndex) wizard.goToStep(i);
                }}
                disabled={i > wizard.stepIndex}
              >
                <span className="event-wizard__step-icon">
                  <Icon size={14} />
                </span>
                <span className="event-wizard__step-label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="event-wizard__preview">
        <EventFormPreview compact />
      </div>

      <div className="event-wizard__panel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            ref={slideRef}
            key={wizard.stepId}
            className="event-wizard__slide"
            style={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}
            initial={{ opacity: 0, x: wizard.direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: wizard.direction * -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <StepPanel stepId={wizard.stepId} errors={errors} schedule={schedule} />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="event-wizard__footer">
        <div className="event-wizard__footer-start">
          {!wizard.isFirst ? (
            <Button appearance="subtle" onClick={wizard.goBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
          ) : editEventId ? (
            <Button appearance="subtle" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          ) : (
            <Button appearance="subtle" onClick={onClear}>
              Clear form
            </Button>
          )}
        </div>
        <div className="event-wizard__footer-end">
          <Button appearance="primary" loading={loading} onClick={handlePrimary}>
            {wizard.isLast ? (
              editEventId ? "Update Event" : "Publish Event"
            ) : (
              <>
                Continue
                <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
