import { ArrowRight, CalendarDays, Clock, Trash2 } from "lucide-react";
import ErrorMessage from "../EroorMessage";
import { ProDateField, ProTimeField } from "./ProDateTimePickers";

export type ScheduleDay = {
  id: string;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
};

function formatTimeLabel(value: Date | null): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatScheduleSummary(day: ScheduleDay): string | null {
  if (!day.date || Number.isNaN(day.date.getTime())) return null;

  const datePart = day.date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const start = formatTimeLabel(day.startTime);
  const end = formatTimeLabel(day.endTime);

  if (start && end) return `${datePart} · ${start} – ${end}`;
  if (start) return `${datePart} · starts ${start}`;
  return datePart;
}

type Props = {
  day: ScheduleDay;
  index: number;
  canRemove: boolean;
  errors?: { date?: string; startTime?: string; endTime?: string };
  onDateChange: (value: Date | null) => void;
  onStartChange: (value: Date | null) => void;
  onEndChange: (value: Date | null) => void;
  onRemove: () => void;
  minDate: Date;
};

export default function ScheduleDayCard({
  day,
  index,
  canRemove,
  errors,
  onDateChange,
  onStartChange,
  onEndChange,
  onRemove,
  minDate,
}: Props) {
  const summary = formatScheduleSummary(day);

  return (
    <article className="schedule-day-card">
      <header className="schedule-day-card__head">
        <div className="schedule-day-card__title-wrap">
          <span className="schedule-day-card__badge" aria-hidden>
            {index + 1}
          </span>
          <div>
            <p className="schedule-day-card__title">Day {index + 1}</p>
            <p className="schedule-day-card__subtitle">Pick date and session times</p>
          </div>
        </div>
        {canRemove && (
          <button type="button" className="schedule-day-card__remove" onClick={onRemove}>
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        )}
      </header>

      {summary && (
        <div className="schedule-day-card__summary" role="status">
          <CalendarDays size={14} />
          <span>{summary}</span>
        </div>
      )}

      <div className="schedule-day-card__fields">
        <div className="schedule-day-card__date">
          <div className="schedule-field-label">
            <CalendarDays size={14} />
            <span>Event date</span>
          </div>
          <ProDateField
            variant="schedule"
            name={`eventDays.${index}.date`}
            label="Select date"
            value={day.date}
            onChange={onDateChange}
            minDate={minDate}
          />
          <ErrorMessage msg={errors?.date} />
        </div>

        <div className="schedule-day-card__times">
          <div className="schedule-day-card__time">
            <div className="schedule-field-label">
              <Clock size={14} />
              <span>Start</span>
            </div>
            <ProTimeField
              variant="schedule"
              name={`eventDays.${index}.startTime`}
              label="Start time"
              value={day.startTime}
              onChange={onStartChange}
            />
            <ErrorMessage msg={errors?.startTime} />
          </div>

          <div className="schedule-day-card__time-divider" aria-hidden>
            <ArrowRight size={16} />
          </div>

          <div className="schedule-day-card__time">
            <div className="schedule-field-label">
              <Clock size={14} />
              <span>End</span>
            </div>
            <ProTimeField
              variant="schedule"
              name={`eventDays.${index}.endTime`}
              label="End time"
              value={day.endTime}
              onChange={onEndChange}
            />
            <ErrorMessage msg={errors?.endTime} />
          </div>
        </div>
      </div>
    </article>
  );
}
