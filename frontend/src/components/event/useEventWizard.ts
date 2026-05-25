import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "../../hooks/hooks";
import { validateEventWizardStep } from "../../utils/eventFormValidation";
import {
  EVENT_WIZARD_STEPS,
  getStepIdForIndex,
  type EventWizardStepId,
} from "./eventWizardConfig";

export function useEventWizard(initialStep = 0) {
  const form = useAppSelector((s) => s.event.form);
  const editEventId = useAppSelector((s) => s.event.editEventId);
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [direction, setDirection] = useState(1);

  const stepId = getStepIdForIndex(stepIndex);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === EVENT_WIZARD_STEPS.length - 1;

  const goToStep = useCallback((index: number) => {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(Math.max(0, Math.min(EVENT_WIZARD_STEPS.length - 1, index)));
  }, [stepIndex]);

  const validateCurrentStep = useCallback((): boolean => {
    const result = validateEventWizardStep(stepId, form);
    if (!result.valid) {
      toast.error(result.message ?? "Please fix the errors in this step");
      if (result.focusField) {
        const el = document.querySelector(`[name="${result.focusField}"]`);
        if (el) (el as HTMLElement).focus();
      }
      return false;
    }
    return true;
  }, [stepId, form]);

  const goNext = useCallback((): boolean => {
    if (!validateCurrentStep()) return false;
    if (!isLast) {
      setDirection(1);
      setStepIndex((i) => i + 1);
    }
    return true;
  }, [validateCurrentStep, isLast]);

  const goBack = useCallback(() => {
    if (!isFirst) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }
  }, [isFirst]);

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setDirection(1);
  }, []);

  return {
    stepIndex,
    stepId,
    direction,
    isFirst,
    isLast,
    editEventId,
    steps: EVENT_WIZARD_STEPS,
    goToStep,
    goNext,
    goBack,
    resetWizard,
    validateCurrentStep,
  };
}

export type { EventWizardStepId };
