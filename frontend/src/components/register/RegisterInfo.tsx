import type { FC } from "react";
import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Globe,
  Users,
  Wallet,
  ChevronDown,
} from "lucide-react";
import type { EventResponseType, EventDay } from "../../Types/event";
import { formatDayDate, formatDayTime, formatRegWindow } from "../../utils/eventFormat";
import {
  formatEventPricingLabel,
  getEventPricingTier,
  normalizeEventPricing,
} from "../../utils/pricing";

interface RegisterInfoProps {
  event: EventResponseType;
}

const RegisterInfo: FC<RegisterInfoProps> = ({ event }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const days = event?.eventDays ?? [];
  const firstDay = days[0];
  const desc = event?.description?.trim() ?? "";
  const showDescToggle = desc.length > 120;
  const pricingTier = getEventPricingTier(event);
  const normalized = normalizeEventPricing(event);
  const showGuestFeeHint =
    normalized.allowGuests &&
    normalized.guestPaymentEnabled &&
    (normalized.guestPrice ?? 0) > 0;

  const firstSession =
    firstDay &&
    `${formatDayDate(firstDay.date)} · ${formatDayTime(firstDay.startTime)} – ${formatDayTime(firstDay.endTime)}`;

  return (
    <article className="event-register-hero pro-animate-in">
      <div className="event-register-hero__glow" aria-hidden />

      <header className="event-register-hero__head">
        <div className="event-register-hero__head-main min-w-0">
          <p className="event-register-hero__eyebrow">Event registration</p>
          <h1 className="event-register-hero__title">{event?.title}</h1>
        </div>
        <div className="text-right">
          <div
            className={`event-register-hero__price event-register-hero__price--${pricingTier}`}
          >
            <Wallet size={14} aria-hidden />
            <span>{formatEventPricingLabel(event)}</span>
          </div>
          {showGuestFeeHint && (
            <p className="event-register-hero__price-hint">
              Guest fees apply when you add companions
              {normalized.freeGuestCount
                ? ` (first ${normalized.freeGuestCount} free)`
                : ""}
            </p>
          )}
        </div>
      </header>

      {desc && (
        <div className="event-register-hero__desc-wrap">
          <p
            className={`event-register-hero__desc${
              !descExpanded && showDescToggle ? " event-register-hero__desc--clamp" : ""
            }`}
          >
            {desc}
          </p>
          {showDescToggle && (
            <button
              type="button"
              className="event-register-hero__desc-toggle"
              onClick={() => setDescExpanded((v) => !v)}
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      <div className="event-register-hero__facts">
        <span className="event-register-hero__fact">
          {event?.locationType === "online" ? <Globe size={12} /> : <MapPin size={12} />}
          {event?.locationType === "online" ? "Online" : "In person"}
        </span>
        {event?.locationType === "offline" && event?.location && (
          <span className="event-register-hero__fact event-register-hero__fact--muted" title={event.location}>
            {event.location}
          </span>
        )}
        <span className="event-register-hero__fact">
          <CalendarDays size={12} />
          {days.length} day{days.length === 1 ? "" : "s"}
        </span>
        {firstSession && (
          <span className="event-register-hero__fact event-register-hero__fact--accent" title={firstSession}>
            {firstSession}
          </span>
        )}
        <span className="event-register-hero__fact">
          Reg: {formatRegWindow(event.registrationStart, event.registrationDeadline)}
        </span>
        <span className="event-register-hero__fact">
          {event.maxParticipants ? `${event.maxParticipants} seats` : "Unlimited"}
        </span>
        <span className="event-register-hero__fact">
          {event.isRefundable ? "Refundable" : "Non-refundable"}
        </span>
        <span
          className={`event-register-hero__fact${
            event?.allowGuests ? " event-register-hero__fact--accent" : ""
          }`}
        >
          <Users size={12} />
          {event?.allowGuests ? `Guests max ${event?.maxPerUser ?? 0}` : "No guests"}
        </span>
      </div>

      {days.length > 0 && (
        <div className="event-register-hero__schedule">
          <button
            type="button"
            className="event-register-hero__schedule-toggle"
            onClick={() => setScheduleOpen((o) => !o)}
            aria-expanded={scheduleOpen}
          >
            <CalendarDays size={14} />
            <span>Schedule</span>
            <span className="event-register-hero__schedule-count">{days.length}</span>
            <ChevronDown
              size={14}
              className={`event-register-hero__chevron${scheduleOpen ? " event-register-hero__chevron--open" : ""}`}
            />
          </button>

          {scheduleOpen && (
            <div className="event-register-hero__schedule-list">
              {days.map((d: EventDay, i: number) => (
                <p key={i} className="event-register-hero__schedule-row">
                  <span className="event-register-hero__schedule-day">Day {i + 1}</span>
                  <span className="event-register-hero__schedule-sep">·</span>
                  <span>{formatDayDate(d.date)}</span>
                  <span className="event-register-hero__schedule-sep">·</span>
                  <span className="event-register-hero__schedule-time">
                    {formatDayTime(d.startTime)} – {formatDayTime(d.endTime)}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default RegisterInfo;
