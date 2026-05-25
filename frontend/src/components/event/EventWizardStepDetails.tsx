import { Input, Toggle } from "rsuite";
import { CalendarDays, Globe, Building2 } from "lucide-react";
import { useMemo } from "react";
import { useAppSelector } from "../../hooks/hooks";
import FormFieldFeedback from "./FormFieldFeedback";
import { FieldLabel, useEventFormHandle } from "./eventFormShared";
import {
  getEventFormFeedback,
  getEventScheduleBounds,
  formatDateTimeLabel,
} from "../../utils/eventFormValidation";
import { ProDateTimeField } from "./ProDateTimePickers";

type Props = {
  errors: Record<string, any>;
};

function CompactToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="event-form-toggle-row">
      <div className="min-w-0">
        <p className="event-form-label">{label}</p>
        <p className="event-form-hint">{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function EventWizardStepDetails({ errors }: Props) {
  const form = useAppSelector((s) => s.event.form);
  const handle = useEventFormHandle();
  const liveFeedback = useMemo(() => getEventFormFeedback(form), [form]);
  const scheduleBounds = useMemo(() => getEventScheduleBounds(form.eventDays ?? []), [form.eventDays]);

  const regStart = form.registrationStart ? new Date(form.registrationStart) : null;
  const regDeadline = form.registrationDeadline ? new Date(form.registrationDeadline) : null;

  return (
    <div className="event-wizard-step space-y-4">
      <section className="space-y-2">
        <h4 className="event-wizard-step__heading">Location</h4>
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
          <FormFieldFeedback error={errors?.location} feedback={liveFeedback.location} />
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="event-wizard-step__heading">Registration window</h4>
        {scheduleBounds ? (
          <div className="event-form-schedule-context" role="status">
            <CalendarDays size={14} aria-hidden />
            <span>
              Event runs {formatDateTimeLabel(scheduleBounds.firstStart)} →{" "}
              {formatDateTimeLabel(scheduleBounds.lastEnd)}
            </span>
          </div>
        ) : (
          <p className="event-form-hint">Set schedule in the next step to link registration dates.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <ProDateTimeField
              name="registrationStart"
              label="Registration opens"
              value={regStart && !Number.isNaN(regStart.getTime()) ? regStart : null}
              onChange={(v) => handle("registrationStart", v ? v.toISOString() : null)}
              maxDateTime={scheduleBounds?.lastEnd}
            />
            <FormFieldFeedback error={errors?.registrationStart} feedback={liveFeedback.registrationStart} />
          </div>
          <div>
            <ProDateTimeField
              name="registrationDeadline"
              label="Registration closes"
              value={regDeadline && !Number.isNaN(regDeadline.getTime()) ? regDeadline : null}
              onChange={(v) => handle("registrationDeadline", v ? v.toISOString() : null)}
              minDateTime={regStart ?? undefined}
              maxDateTime={scheduleBounds?.lastEnd}
            />
            <FormFieldFeedback error={errors?.registrationDeadline} feedback={liveFeedback.registrationDeadline} />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="event-wizard-step__heading">Pricing & guests</h4>
        <div className="event-wizard-step__toggle-stack">
          <CompactToggle
            label="Paid event"
            hint="Collect payments for registrations"
            checked={form.isPaid}
            onChange={(v) => handle("isPaid", v)}
          />
          {form.isPaid && (
            <>
              <CompactToggle
                label="Investor entry free"
                hint="No charge for primary investor pass"
                checked={form.investorIsFree}
                onChange={(v) => handle("investorIsFree", v)}
              />
              {!form.investorIsFree && (
                <div className="pt-1">
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
                  <FormFieldFeedback error={errors?.investorPrice || errors?.price} feedback={liveFeedback.price} />
                </div>
              )}
              {form.allowGuests && (
                <>
                  <CompactToggle
                    label="Charge for guests"
                    hint="Per-guest pricing after free allowance"
                    checked={form.guestPaymentEnabled}
                    onChange={(v) => handle("guestPaymentEnabled", v)}
                  />
                  {form.guestPaymentEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <FieldLabel>Guest price (₹)</FieldLabel>
                        <Input
                          name="guestPrice"
                          type="number"
                          placeholder="199"
                          value={form.guestPrice === 0 ? "" : form.guestPrice}
                          onChange={(v) => handle("guestPrice", Number(v) || 0)}
                        />
                        <FormFieldFeedback error={errors?.guestPrice} />
                      </div>
                      <div>
                        <FieldLabel hint="First N guests free">Free guest count</FieldLabel>
                        <Input
                          name="freeGuestCount"
                          type="number"
                          placeholder="0"
                          value={form.freeGuestCount === 0 ? "" : form.freeGuestCount}
                          onChange={(v) => handle("freeGuestCount", Number(v) || 0)}
                        />
                        <FormFieldFeedback error={errors?.freeGuestCount} feedback={liveFeedback.freeGuestCount} />
                      </div>
                    </div>
                  )}
                </>
              )}
              <CompactToggle
                label="Refundable"
                hint="Allow refunds before the event"
                checked={form.isRefundable}
                onChange={(v) => handle("isRefundable", v)}
              />
            </>
          )}
          <CompactToggle
            label="Allow guests"
            hint="Registrants can bring additional people"
            checked={form.allowGuests}
            onChange={(v) => handle("allowGuests", v)}
          />
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
            <FormFieldFeedback error={errors?.maxPerUser} feedback={liveFeedback.maxPerUser} />
          </div>
        )}
        <div>
          <FieldLabel hint="0 = unlimited">Max participants (total)</FieldLabel>
          <Input
            name="maxParticipants"
            type="number"
            placeholder="0"
            value={form.maxParticipants === 0 ? "" : form.maxParticipants}
            onChange={(v) => handle("maxParticipants", Number(v) || 0)}
          />
          <FormFieldFeedback error={errors?.maxParticipants} />
        </div>
      </section>
    </div>
  );
}
