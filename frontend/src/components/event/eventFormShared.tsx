import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { updateField } from "../../redux/EventSlice";
import { formatTimeHHMM, withTimeOnDate } from "./ProDateTimePickers";

export type EventDayState = {
  id: string;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
};

export const defaultEventDay = (): EventDayState => ({
  id: `${Date.now()}-${Math.random()}`,
  date: null,
  startTime: null,
  endTime: null,
});

export function parseTimeOnDate(date: Date | null, time: unknown): Date | null {
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

export function convertApiDays(days: any[]): EventDayState[] {
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

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="event-form-label-wrap">
      <label className="event-form-label">{children}</label>
      {hint && <p className="event-form-hint">{hint}</p>}
    </div>
  );
}

export function useEventFormHandle() {
  const dispatch = useAppDispatch();

  return useCallback(
    (k: string, v: unknown) => {
      if (k === "isPaid" && v === false) {
        dispatch(updateField({ key: "investorIsFree", value: true }));
        dispatch(updateField({ key: "investorPrice", value: 0 }));
        dispatch(updateField({ key: "guestPaymentEnabled", value: false }));
        dispatch(updateField({ key: "guestPrice", value: 0 }));
        dispatch(updateField({ key: "freeGuestCount", value: 0 }));
        dispatch(updateField({ key: "price", value: 0 }));
        dispatch(updateField({ key: "isRefundable", value: false }));
      }
      if (k === "allowGuests" && v === false) {
        dispatch(updateField({ key: "guestPaymentEnabled", value: false }));
        dispatch(updateField({ key: "guestPrice", value: 0 }));
        dispatch(updateField({ key: "freeGuestCount", value: 0 }));
        dispatch(updateField({ key: "maxPerUser", value: 1 }));
      }
      dispatch(updateField({ key: k, value: v }));
    },
    [dispatch]
  );
}

export function useEventScheduleState(formResetKey: number) {
  const dispatch = useAppDispatch();
  const form = useAppSelector((s) => s.event.form);
  const editEventId = useAppSelector((s) => s.event.editEventId);
  const lastEditId = useRef<string | null>(null);
  const [eventDays, setEventDays] = useState<EventDayState[]>([defaultEventDay()]);

  useEffect(() => {
    if (formResetKey > 0) {
      setEventDays([defaultEventDay()]);
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

  const addDay = () => setEventDays((prev) => [...prev, defaultEventDay()]);
  const removeDay = (id: string) => setEventDays((prev) => prev.filter((d) => d.id !== id));
  const updateDay = (id: string, key: "date" | "startTime" | "endTime", value: Date | null) => {
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

  return { eventDays, addDay, removeDay, updateDay };
}
