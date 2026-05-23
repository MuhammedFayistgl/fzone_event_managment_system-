import { Input, Toggle, DatePicker, SelectPicker, Button } from "rsuite";
import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { updateField } from "../../redux/EventSlice";
import ErrorMessage from "../EroorMessage";

type EventDay = {
  id: string;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
};

export default function EventForm({ errors }: any) {
  const dispatch = useAppDispatch();
  const form = useAppSelector((s) => s.event.form);
  console.log('form', form)
  const initialized = useRef(false); // ✅ prevent loop

  const [eventDays, setEventDays] = useState<EventDay[]>([
    {
      id: Date.now().toString(),
      date: null,
      startTime: null,
      endTime: null
    }
  ]);

  const handle = (k: string, v: any) => {
    dispatch(updateField({ key: k, value: v }));
  };

  // ✅ ================= EDIT MODE SYNC (RUN ONLY ONCE) =================
  useEffect(() => {
    if (!initialized.current && form.eventDays && form.eventDays.length > 0) {
      const converted = form.eventDays.map((d: any) => ({
        id: Date.now().toString() + Math.random(),
        date: d.date ? new Date(d.date) : null,
        startTime: d.startTime ? new Date(d.startTime) : null,
        endTime: d.endTime ? new Date(d.endTime) : null
      }));

      setEventDays(converted);
      initialized.current = true; // ✅ stop loop
    }
  }, [form.eventDays]);

  // ✅ ================= ADD / REMOVE / UPDATE =================

  const addDay = () => {
    setEventDays((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        date: null,
        startTime: null,
        endTime: null
      }
    ]);
  };

  const removeDay = (id: string) => {
    setEventDays((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDay = (
    id: string,
    key: keyof EventDay,
    value: Date | null
  ) => {
    setEventDays((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
            ...d,
            [key]: value
          }
          : d
      )
    );
  };

  // ✅ ================= SAFE SYNC (NO DATE OBJECT IN REDUX) =================
  useEffect(() => {
    const safeData = eventDays.map((d) => ({
      date: d.date ? d.date.toISOString().split("T")[0] : null,
      startTime: d.startTime
        ? d.startTime.toTimeString().slice(0, 5)
        : null,
      endTime: d.endTime
        ? d.endTime.toTimeString().slice(0, 5)
        : null
    }));

    dispatch(updateField({ key: "eventDays", value: safeData }));
  }, [eventDays, dispatch]);

  return (
    <div className="space-y-6">

      {/* TITLE */}
      <div>
        <Input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={(v) => handle("title", v)}
        />
        <ErrorMessage msg={errors.title} />
      </div>

      {/* DESCRIPTION */}
      <div>
        <Input
          name="description"
          as="textarea"
          rows={3}
          placeholder="Description"
          value={form.description}
          onChange={(v) => handle("description", v)}
        />
        <ErrorMessage msg={errors.description} />
      </div>
      {/* remove */}
      {/* ================= REGISTRATION ================= */}
      {/* <div className="bg-gray-50 p-4 rounded-xl space-y-4">
        <h3 className="font-semibold">Registration</h3>

        <DatePicker
        name="registrationStart"
          placeholder="Start Date"
          value={form.registrationStart ? new Date(form.registrationStart) : null}
          onChange={(v) =>
            handle("registrationStart", v ? v.toISOString() : null)
          }
          block
        />
        <ErrorMessage msg={errors?.registrationStart} />

        <DatePicker
        name="registrationDeadline"
          placeholder="Deadline"
          value={form.registrationDeadline ? new Date(form.registrationDeadline) : null}
          onChange={(v) =>
            handle("registrationDeadline", v ? v.toISOString() : null)
          }
          block
        />
      <ErrorMessage msg={errors?.registrationDeadline} />
      </div> */}

      {/* ================= EVENT DAYS ================= */}
      <div className="app-card-muted p-4 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-app-text">Event Schedule</h3>
          <Button size="sm" onClick={addDay}>+ Add Day</Button>
        </div>

        {eventDays.map((day, i) => (
          <div key={day.id} className="app-card-muted p-4 space-y-3">

            <DatePicker
              name={`eventDays.${i}.date`}
              placeholder="Date"
              value={day.date}
              onChange={(v) => updateDay(day.id, "date", v)}
              block
            />
            <ErrorMessage msg={errors?.eventDays?.[i]?.date} />

            <DatePicker
              name={`eventDays.${i}.startTime`}
              format="hh:mm aa"
              showMeridiem
              placeholder="Start Time"
              value={day.startTime}
              onChange={(v) => updateDay(day.id, "startTime", v)}
              block
            />
            <ErrorMessage msg={errors?.eventDays?.[i]?.startTime} />

            <DatePicker
              name={`eventDays.${i}.endTime`}
              format="hh:mm aa"
              showMeridiem
              placeholder="End Time"
              value={day.endTime}
              onChange={(v) => updateDay(day.id, "endTime", v)}
              block
            />
            <ErrorMessage msg={errors?.eventDays?.[i]?.endTime} />

            {eventDays.length > 1 && (
              <div className="flex justify-end">
                <Button
                  size="xs"
                  color="red"
                  appearance="ghost"
                  onClick={() => removeDay(day.id)}
                >
                  Remove
                </Button>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* باقي same */}
      <Toggle checked={form.isPaid} onChange={(v) => handle("isPaid", v)}>Paid</Toggle>

      {form.isPaid && (
        <>

          <Input
            name="price"
            type="number"
            placeholder="Price"
            value={form.price === 0 ? "" : form.price}
            onChange={(v) => handle("price", Number(v))}
          />
          <ErrorMessage msg={errors?.price} />
        </>
      )}
      {form.isPaid && <Toggle checked={form.isRefundable} onChange={(v) => handle("isRefundable", v)}>Refundable</Toggle>}


      <Toggle checked={form.allowGuests} onChange={(v) => handle("allowGuests", v)}>Guests</Toggle>

      {form.allowGuests && (
        <>
          <Input
            name="maxPerUser"
            type="number"
            value={form.maxPerUser === 0 ? "" : form.maxPerUser}
            onChange={(v) => handle("maxPerUser", Number(v))}
          />
          <ErrorMessage msg={errors?.maxPerUser} />
        </>
      )}

      <SelectPicker
        name="location"
        data={[
          { label: "Online", value: "online" },
          { label: "Offline", value: "offline" }
        ]}
        value={form.locationType}
        onChange={(v) => handle("locationType", v)}
        block
      />

      <Input
        name="location"
        placeholder={form.locationType === "online" ? "Meeting Link" : "Address"}
        value={form.location}
        onChange={(v) => handle("location", v)}
      />
      <ErrorMessage msg={errors?.location} />
    </div>
  );
}