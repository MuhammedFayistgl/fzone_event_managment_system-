import { CalendarDays, MapPin, Users, Wallet } from "lucide-react";
import { useAppSelector } from "../../hooks/hooks";
import { formatEventPricingLabel } from "../../utils/pricing";

type Props = {
  compact?: boolean;
};

export default function EventFormPreview({ compact = false }: Props) {
  const form = useAppSelector((s) => s.event.form);

  const firstDay = form.eventDays?.[0];
  const hasDate = firstDay?.date && firstDay?.startTime;

  let dateLabel = "Date not set";
  if (hasDate) {
    const d = new Date(`${firstDay.date}T${firstDay.startTime}:00`);
    if (!Number.isNaN(d.getTime())) {
      dateLabel = d.toLocaleString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const title = form.title?.trim() || "Your event title";
  const description = form.description?.trim() || "Event description will appear here.";

  if (compact) {
    return (
      <div className="event-preview-card event-preview-card--compact">
        <div className="event-preview-card--compact__text min-w-0">
          <p className="event-preview-card__eyebrow">Live preview</p>
          <p className="event-preview-card--compact__title truncate">{title}</p>
        </div>
        <div className="event-preview-card__meta event-preview-card--compact__meta">
          <span className="event-preview-card__chip">
            <CalendarDays size={12} />
            {dateLabel}
          </span>
          <span className="event-preview-card__chip">
            <MapPin size={12} />
            {form.locationType === "online" ? "Online" : form.location || "Venue TBD"}
          </span>
          <span className="event-preview-card__chip">
            <Wallet size={12} />
            {formatEventPricingLabel(form)}
          </span>
          {form.maxParticipants > 0 && (
            <span className="event-preview-card__chip">
              <Users size={12} />
              Max {form.maxParticipants}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="event-preview-card">
      <p className="event-preview-card__eyebrow">Live preview</p>
      <h3 className="event-preview-card__title">{title}</h3>
      <p className="event-preview-card__desc">{description}</p>

      <div className="event-preview-card__meta">
        <span className="event-preview-card__chip">
          <CalendarDays size={14} />
          {dateLabel}
        </span>
        <span className="event-preview-card__chip">
          <MapPin size={14} />
          {form.locationType === "online" ? "Online" : form.location || "Venue TBD"}
        </span>
        <span className="event-preview-card__chip">
          <Wallet size={14} />
          {formatEventPricingLabel(form)}
        </span>
        {form.maxParticipants > 0 && (
          <span className="event-preview-card__chip">
            <Users size={14} />
            Max {form.maxParticipants}
          </span>
        )}
      </div>
    </div>
  );
}
