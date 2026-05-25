import type { LucideIcon } from "lucide-react";
import { CalendarDays, FileText, SlidersHorizontal, Ticket } from "lucide-react";

export type EventWizardStepId = "basics" | "details" | "schedule" | "ticket";

export type EventWizardStepConfig = {
  id: EventWizardStepId;
  label: string;
  icon: LucideIcon;
};

export const EVENT_WIZARD_STEPS: EventWizardStepConfig[] = [
  { id: "basics", label: "Basics", icon: FileText },
  { id: "details", label: "Details", icon: SlidersHorizontal },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "ticket", label: "Ticket", icon: Ticket },
];

export function getStepIndex(stepId: EventWizardStepId): number {
  return EVENT_WIZARD_STEPS.findIndex((s) => s.id === stepId);
}

/** Map a Zod/normalized field path to the wizard step index */
export function getStepIndexForFieldPath(fieldPath: string): number {
  const root = fieldPath.split(".")[0];

  if (root === "title" || root === "description") return 0;
  if (root === "eventDays") return 2;
  if (root === "ticketDesign") return 3;

  return 1;
}

export function getStepIdForIndex(index: number): EventWizardStepId {
  return EVENT_WIZARD_STEPS[index]?.id ?? "basics";
}
