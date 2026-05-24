import { Input, Toggle } from "rsuite";
import { useState, useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";
import {
  FileText,
  CalendarDays,
  Wallet,
  MapPin,
  Globe,
  Building2,
  Plus,
  Ticket,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { updateField } from "../../redux/EventSlice";
import ErrorMessage from "../EroorMessage";
import {
  ProPickerProvider,
  ProDateTimeField,
  formatTimeHHMM,
  withTimeOnDate,
} from "./ProDateTimePickers";
import ScheduleDayCard from "./ScheduleDayCard";
import TicketDesignSection from "./TicketDesignSection";

type EventDay = {
  id: string;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
};

type Props = {
  errors: Record<string, any>;
  formResetKey?: number;
};

const defaultDay = (): EventDay => ({
  id: `${Date.now()}-${Math.random()}`,
  date: null,
  startTime: null,
  endTime: null,
});

function parseTimeOnDate(date: Date | null, time: unknown): Date | null {
  if (!time) return null;
  if (time instanceof Date) return time;
  if (typeof time === "string") {
    if (time.includes("T")) {
      const parsed = new Date(time);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (date && /^\d{2}:\d{2}$/.test(time)) {
      const d = new Date(date);
      const [h, m] = time.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  return null;
}

function convertApiDays(days: any[]): EventDay[] {
  return days.map((d) => {
    const date = d.date ? new Date(d.date) : null;
    return {
      id: `${Date.now()}-${Math.random()}`,
      date: date && !Number.isNaN(date.getTime()) ? date : null,
      startTime: parseTimeOnDate(date, d.startTime),
      endTime: parseTimeOnDate(date, d.endTime),
    };
  });
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="event-form-label-wrap">
      <label className="event-form-label">{children}</label>
      {hint && <p className="event-form-hint">{hint}</p>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  delay,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  delay?: string;
}) {
  return (
    <section
      className="event-form-section pro-animate-in"
      style={{ "--pro-delay": delay ?? "0ms" } as CSSProperties}
    >
      <div className="event-form-section__head">
        <div className="event-form-section__icon">
          <Icon size={18} />
        </div>
        <h3 className="event-form-section__title">{title}</h3>
      </div>
      <div className="event-form-section__body">{children}</div>
    </section>
  );
}

export default function EventForm({ errors, formResetKey = 0 }: Props) {
  const dispatch = useAppDispatch();
  const form = useAppSelector((s) => s.event.form);
  const editEventId = useAppSelector((s) => s.event.editEventId);
  const lastEditId = useRef<string | null>(null);

  const [eventDays, setEventDays] = useState<EventDay[]>([defaultDay()]);

  const handle = (k: string, v: unknown) => {
    if (k === "isPaid" && v === false) {
      dispatch(updateField({ key: "investorIsFree", value: true }));
      dispatch(updateField({ key: "investorPrice", value: 0 }));
      dispatch(updateField({ key: "guestPaymentEnabled", value: false }));
      dispatch(updateField({ key: "guestPrice", value: 0 }));
      dispatch(updateField({ key: "freeGuestCount", value: 0 }));
      dispatch(updateField({ key: "price", value: 0 }));
    }
    if (k === "allowGuests" && v === false) {
      dispatch(updateField({ key: "guestPaymentEnabled", value: false }));
      dispatch(updateField({ key: "guestPrice", value: 0 }));
      dispatch(updateField({ key: "freeGuestCount", value: 0 }));
    }
    dispatch(updateField({ key: k, value: v }));
  };

  useEffect(() => {
    if (formResetKey > 0) {
      setEventDays([defaultDay()]);
      lastEditId.current = null;
    }
  }, [formResetKey]);

  useEffect(() => {
    if (editEventId && editEventId !== lastEditId.current && form.eventDays?.length > 0) {
      lastEditId.current = editEventId;
      setEventDays(convertApiDays(form.eventDays));
    }
    if (!editEventId) {
      lastEditId.current = null;
    }
  }, [editEventId, form.eventDays]);

  useEffect(() => {
    const safeData = eventDays.map((d) => ({
      date: d.date ? d.date.toISOString().split("T")[0] : null,
      startTime: formatTimeHHMM(d.startTime),
      endTime: formatTimeHHMM(d.endTime),
    }));
    dispatch(updateField({ key: "eventDays", value: safeData }));
  }, [eventDays, dispatch]);

  const addDay = () => setEventDays((prev) => [...prev, defaultDay()]);
  const removeDay = (id: string) => setEventDays((prev) => prev.filter((d) => d.id !== id));
  const updateDay = (
    id: string,
    key: "date" | "startTime" | "endTime",
    value: Date | null
  ) => {
    setEventDays((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (key === "date") {
          return {
            ...d,
            date: value,
            startTime: d.startTime ? withTimeOnDate(value, d.startTime) : null,
            endTime: d.endTime ? withTimeOnDate(value, d.endTime) : null,
          };
        }
        return { ...d, [key]: value ? withTimeOnDate(d.date, value) : null };
      })
    );
  };

  const regStart = form.registrationStart ? new Date(form.registrationStart) : null;
  const regDeadline = form.registrationDeadline ? new Date(form.registrationDeadline) : null;

  return (
    <ProPickerProvider>
    <div className="event-form space-y-5">
      <Section icon={FileText} title="Basics" delay="0ms">
        <div className="space-y-4">
          <div>
            <FieldLabel hint="3–80 characters">{`Title (${form.title.length}/80)`}</FieldLabel>
            <Input
              name="title"
              placeholder="Annual Meet 2026"
              value={form.title}
              maxLength={80}
              onChange={(v) => handle("title", v)}
            />
            <ErrorMessage msg={errors.title} />
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
            <ErrorMessage msg={errors.description} />
          </div>
        </div>
      </Section>

      <Section icon={CalendarDays} title="Schedule" delay="80ms">
        <div className="schedule-section">
          <p className="schedule-section__intro">
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
                minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                onDateChange={(v) => updateDay(day.id, "date", v)}
                onStartChange={(v) => updateDay(day.id, "startTime", v)}
                onEndChange={(v) => updateDay(day.id, "endTime", v)}
                onRemove={() => removeDay(day.id)}
              />
            ))}
          </div>
          <button type="button" className="schedule-section__add" onClick={addDay}>
            <Plus size={16} />
            <span>Add another day</span>
          </button>
        </div>
      </Section>

      <Section icon={Ticket} title="Entry ticket design" delay="180ms">
        <div id="ticket-design">
          <TicketDesignSection />
        </div>
      </Section>

      <Section icon={Ticket} title="Registration window" delay="120ms">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ProDateTimeField
              name="registrationStart"
              label="Registration opens"
              value={regStart && !Number.isNaN(regStart.getTime()) ? regStart : null}
              onChange={(v) => handle("registrationStart", v ? v.toISOString() : null)}
            />
            <p className="event-form-hint mt-1">Optional — leave empty to open now</p>
            <ErrorMessage msg={errors?.registrationStart} />
          </div>
          <div>
            <ProDateTimeField
              name="registrationDeadline"
              label="Registration closes"
              value={regDeadline && !Number.isNaN(regDeadline.getTime()) ? regDeadline : null}
              onChange={(v) => handle("registrationDeadline", v ? v.toISOString() : null)}
              minDateTime={regStart ?? undefined}
            />
            <p className="event-form-hint mt-1">Optional — leave empty for no deadline</p>
            <ErrorMessage msg={errors?.registrationDeadline} />
          </div>
        </div>
      </Section>

      <Section icon={Wallet} title="Pricing & guests" delay="160ms">
        <div className="space-y-4">
          <div className="event-form-toggle-row">
            <div>
              <p className="event-form-label">Paid event</p>
              <p className="event-form-hint">Enable payment collection for registrations</p>
            </div>
            <Toggle checked={form.isPaid} onChange={(v) => handle("isPaid", v)} />
          </div>
          {form.isPaid && (
            <>
              <div className="event-form-toggle-row">
                <div>
                  <p className="event-form-label">Investor entry free</p>
                  <p className="event-form-hint">No charge for the primary investor pass</p>
                </div>
                <Toggle checked={form.investorIsFree} onChange={(v) => handle("investorIsFree", v)} />
              </div>
              {!form.investorIsFree && (
                <div>
                  <FieldLabel>Investor price (₹)</FieldLabel>
                  <Input
                    name="investorPrice"
                    type="number"
                    placeholder="499"
                    value={form.investorPrice === 0 ? "" : form.investorPrice}
                    onChange={(v) => {
                      const n = Number(v) || 0;
                      handle("investorPrice", n);
                      handle("price", n);
                    }}
                  />
                  <ErrorMessage msg={errors?.investorPrice || errors?.price} />
                </div>
              )}
              {form.allowGuests && (
                <>
                  <div className="event-form-toggle-row">
                    <div>
                      <p className="event-form-label">Charge for guests</p>
                      <p className="event-form-hint">Enable per-guest pricing after free allowance</p>
                    </div>
                    <Toggle checked={form.guestPaymentEnabled} onChange={(v) => handle("guestPaymentEnabled", v)} />
                  </div>
                  {form.guestPaymentEnabled && (
                    <>
                      <div>
                        <FieldLabel>Guest price (₹)</FieldLabel>
                        <Input
                          name="guestPrice"
                          type="number"
                          placeholder="199"
                          value={form.guestPrice === 0 ? "" : form.guestPrice}
                          onChange={(v) => handle("guestPrice", Number(v) || 0)}
                        />
                        <ErrorMessage msg={errors?.guestPrice} />
                      </div>
                      <div>
                        <FieldLabel hint="First N guests are free">Free guest count</FieldLabel>
                        <Input
                          name="freeGuestCount"
                          type="number"
                          placeholder="0"
                          value={form.freeGuestCount === 0 ? "" : form.freeGuestCount}
                          onChange={(v) => handle("freeGuestCount", Number(v) || 0)}
                        />
                        <ErrorMessage msg={errors?.freeGuestCount} />
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="event-form-toggle-row">
                <div>
                  <p className="event-form-label">Refundable</p>
                  <p className="event-form-hint">Allow refunds before the event</p>
                </div>
                <Toggle checked={form.isRefundable} onChange={(v) => handle("isRefundable", v)} />
              </div>
            </>
          )}
          <div className="event-form-toggle-row">
            <div>
              <p className="event-form-label">Allow guests</p>
              <p className="event-form-hint">Let registrants bring additional participants</p>
            </div>
            <Toggle checked={form.allowGuests} onChange={(v) => handle("allowGuests", v)} />
          </div>
          {form.allowGuests && (
            <div>
              <FieldLabel>Max per registration</FieldLabel>
              <Input
                name="maxPerUser"
                type="number"
                placeholder="1"
                value={form.maxPerUser === 0 ? "" : form.maxPerUser}
                onChange={(v) => handle("maxPerUser", Number(v))}
              />
              <ErrorMessage msg={errors?.maxPerUser} />
            </div>
          )}
          <div>
            <FieldLabel hint="0 = unlimited capacity">Max participants (total)</FieldLabel>
            <Input
              name="maxParticipants"
              type="number"
              placeholder="0"
              value={form.maxParticipants === 0 ? "" : form.maxParticipants}
              onChange={(v) => handle("maxParticipants", Number(v) || 0)}
            />
            <ErrorMessage msg={errors?.maxParticipants} />
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Location" delay="200ms">
        <div className="space-y-4">
          <div className="events-dashboard-tabs event-form-location-tabs">
            {(["online", "offline"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`events-dashboard-tab${form.locationType === type ? " events-dashboard-tab--active" : ""}`}
                onClick={() => handle("locationType", type)}
              >
                {type === "online" ? <Globe size={15} /> : <Building2 size={15} />}
                <span>{type === "online" ? "Online" : "Offline"}</span>
              </button>
            ))}
          </div>
          <div>
            <FieldLabel>
              {form.locationType === "online" ? "Meeting link (https://)" : "Venue address"}
            </FieldLabel>
            <Input
              name="location"
              placeholder={form.locationType === "online" ? "https://meet.google.com/..." : "Full venue address"}
              value={form.location}
              onChange={(v) => handle("location", v)}
            />
            <ErrorMessage msg={errors?.location} />
          </div>
        </div>
      </Section>
    </div>
    </ProPickerProvider>
  );
}
