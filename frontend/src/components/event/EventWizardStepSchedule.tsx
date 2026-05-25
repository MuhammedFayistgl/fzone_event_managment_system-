import { Plus } from "lucide-react";
import { useAppSelector } from "../../hooks/hooks";
import { getEventDayFeedback } from "../../utils/eventFormValidation";
import ScheduleDayCard from "./ScheduleDayCard";
import type { EventDayState } from "./eventFormShared";

type Props = {
  errors: Record<string, any>;
  eventDays: EventDayState[];
  onAddDay: () => void;
  onRemoveDay: (id: string) => void;
  onUpdateDay: (id: string, key: "date" | "startTime" | "endTime", value: Date | null) => void;
};

export default function EventWizardStepSchedule({
  errors,
  eventDays,
  onAddDay,
  onRemoveDay,
  onUpdateDay,
}: Props) {
  const form = useAppSelector((s) => s.event.form);
  const dayInputs = form.eventDays ?? [];
  const minDate = new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="event-wizard-step schedule-section">
      <p className="event-wizard-step__intro">
        Set when your event runs. Add multiple days for multi-day programs.
      </p>
      <div className="schedule-section__days">
        {eventDays.map((day, i) => (
          <ScheduleDayCard
            key={day.id}
            day={day}
            index={i}
            canRemove={eventDays.length > 1}
            errors={errors?.eventDays?.[i]}
            liveFeedback={getEventDayFeedback(
              dayInputs[i] ?? { date: null, startTime: null, endTime: null },
              i,
              dayInputs
            )}
            minDate={minDate}
            onDateChange={(v) => onUpdateDay(day.id, "date", v)}
            onStartChange={(v) => onUpdateDay(day.id, "startTime", v)}
            onEndChange={(v) => onUpdateDay(day.id, "endTime", v)}
            onRemove={() => onRemoveDay(day.id)}
          />
        ))}
      </div>
      <button type="button" className="schedule-section__add" onClick={onAddDay}>
        <Plus size={16} />
        <span>Add another day</span>
      </button>
    </div>
  );
}
