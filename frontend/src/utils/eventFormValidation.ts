/** Shared event form date/time logic — used by Zod schema and live UI feedback */

import type { EventWizardStepId } from "../components/event/eventWizardConfig";

export type EventDayInput = {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type EventFormInput = {
  title: string;
  description: string;
  eventDays: EventDayInput[];
  registrationStart?: string | null;
  registrationDeadline?: string | null;
  isPaid: boolean;
  price: number;
  investorIsFree: boolean;
  investorPrice: number;
  guestPaymentEnabled: boolean;
  guestPrice: number;
  freeGuestCount: number;
  isRefundable: boolean;
  allowGuests: boolean;
  maxPerUser: number;
  maxParticipants: number;
  locationType: "online" | "offline";
  location: string;
};

export type FieldFeedback = {
  status: "error" | "warn" | "ok" | "info";
  message: string;
};

export const combineDateTime = (date: string, time: string): Date => {
  return new Date(`${date}T${time}:00`);
};

export const startOfDay = (input: string | Date): Date => {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Resolve start/end for one day, rolling end to next calendar day when needed (overnight). */
export function resolveEventDayRange(day: EventDayInput): { start: Date; end: Date } | null {
  if (!day.date || !day.startTime || !day.endTime) return null;

  const start = combineDateTime(day.date, day.startTime);
  let end = combineDateTime(day.date, day.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  if (end <= start) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

export function getEventScheduleBounds(eventDays: EventDayInput[]): {
  firstStart: Date;
  lastEnd: Date;
} | null {
  const ranges = eventDays.map(resolveEventDayRange).filter(Boolean) as { start: Date; end: Date }[];
  if (!ranges.length) return null;

  return {
    firstStart: new Date(Math.min(...ranges.map((r) => r.start.getTime()))),
    lastEnd: new Date(Math.max(...ranges.map((r) => r.end.getTime()))),
  };
}

export function isOvernightSession(day: EventDayInput): boolean {
  if (!day.date || !day.startTime || !day.endTime) return false;
  const start = combineDateTime(day.date, day.startTime);
  const end = combineDateTime(day.date, day.endTime);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start;
}

export function formatDurationHours(start: Date, end: Date): string {
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDateTimeLabel(value: Date): string {
  return value.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Live per-field feedback while the user fills the form */
export function getEventFormFeedback(form: EventFormInput): Record<string, FieldFeedback | undefined> {
  const feedback: Record<string, FieldFeedback | undefined> = {};
  const schedule = getEventScheduleBounds(form.eventDays);

  // Title
  const title = form.title.trim();
  if (!title) {
    feedback.title = { status: "info", message: "Enter an event title (min. 3 characters)" };
  } else if (title.length < 3) {
    feedback.title = { status: "error", message: "Title is too short — need at least 3 characters" };
  } else if (!/^[\p{L}0-9\s]+$/u.test(title)) {
    feedback.title = { status: "error", message: "Use letters, numbers, and spaces only" };
  } else if (title.length > 80) {
    feedback.title = { status: "error", message: "Title cannot exceed 80 characters" };
  } else {
    feedback.title = { status: "ok", message: "Title looks good" };
  }

  // Description
  const desc = form.description.trim();
  if (!desc) {
    feedback.description = { status: "info", message: "Describe the event (min. 10 characters)" };
  } else if (desc.length < 10) {
    feedback.description = { status: "error", message: `${10 - desc.length} more character(s) needed` };
  } else if (desc.length > 500) {
    feedback.description = { status: "error", message: "Description cannot exceed 500 characters" };
  } else {
    feedback.description = { status: "ok", message: "Description looks good" };
  }

  // Event days — per-index feedback stored as eventDays.0.date etc. handled in ScheduleDayCard

  // Registration window
  const regStart = form.registrationStart ? new Date(form.registrationStart) : null;
  const regEnd = form.registrationDeadline ? new Date(form.registrationDeadline) : null;
  const regStartValid = regStart && !Number.isNaN(regStart.getTime());
  const regEndValid = regEnd && !Number.isNaN(regEnd.getTime());

  if (regStartValid && regEndValid) {
    if (regEnd <= regStart) {
      feedback.registrationDeadline = {
        status: "error",
        message: "Closing time must be after the opening time",
      };
      feedback.registrationStart = {
        status: "error",
        message: "Opening time must be before the closing time",
      };
    } else {
      feedback.registrationStart = {
        status: "ok",
        message: `Opens ${formatDateTimeLabel(regStart)}`,
      };
      feedback.registrationDeadline = {
        status: "ok",
        message: `Closes ${formatDateTimeLabel(regEnd)}`,
      };
    }
  } else if (regStartValid) {
    feedback.registrationStart = {
      status: "ok",
      message: `Opens ${formatDateTimeLabel(regStart)}`,
    };
    feedback.registrationDeadline = {
      status: "info",
      message: "Optional — leave blank for no closing deadline",
    };
  } else if (regEndValid) {
    feedback.registrationDeadline = {
      status: "ok",
      message: `Closes ${formatDateTimeLabel(regEnd)}`,
    };
    feedback.registrationStart = {
      status: "info",
      message: "Optional — leave blank to open registration immediately",
    };
  }

  if (regStartValid && regEndValid && regEnd > regStart && schedule) {
    if (regEnd > schedule.lastEnd) {
      feedback.registrationDeadline = {
        status: "error",
        message: "Registration cannot close after the event has ended",
      };
    } else if (regEnd > schedule.firstStart) {
      feedback.registrationDeadline = {
        status: "warn",
        message: "Registration closes after the event starts — attendees may register during the event",
      };
    }
    if (regStart > schedule.lastEnd) {
      feedback.registrationStart = {
        status: "error",
        message: "Registration cannot open after the event has ended",
      };
    }
  } else if (regEndValid && schedule && regEnd > schedule.lastEnd) {
    feedback.registrationDeadline = {
      status: "error",
      message: "Registration cannot close after the event has ended",
    };
  }

  // Pricing
  if (form.isPaid) {
    const investorFee = !form.investorIsFree && (form.investorPrice ?? form.price) > 0;
    const guestFee = form.allowGuests && form.guestPaymentEnabled && form.guestPrice > 0;
    if (!investorFee && !guestFee) {
      feedback.price = { status: "warn", message: "Set investor and/or guest pricing for a paid event" };
    } else {
      feedback.price = { status: "ok", message: "Pricing configured" };
    }
    if (form.guestPaymentEnabled && form.freeGuestCount > form.maxPerUser) {
      feedback.freeGuestCount = {
        status: "error",
        message: `Free guests (${form.freeGuestCount}) cannot exceed max per registration (${form.maxPerUser})`,
      };
    }
  } else if (form.price > 0 || form.investorPrice > 0 || form.guestPrice > 0) {
    feedback.price = { status: "error", message: "Remove pricing or enable “Paid event”" };
  }

  if (form.isRefundable && !form.isPaid) {
    feedback.isRefundable = { status: "error", message: "Refunds only apply to paid events" };
  }

  if (!form.allowGuests && form.maxPerUser > 1) {
    feedback.maxPerUser = {
      status: "error",
      message: "When guests are disabled, max per registration must be 1",
    };
  }

  // Location
  const loc = form.location.trim();
  if (!loc) {
    feedback.location = {
      status: "info",
      message: form.locationType === "online" ? "Paste a secure meeting link (https://…)" : "Enter the venue address",
    };
  } else if (form.locationType === "online") {
    try {
      const url = new URL(loc);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      feedback.location = { status: "ok", message: "Valid meeting link" };
    } catch {
      feedback.location = { status: "error", message: "Enter a valid URL starting with https://" };
    }
  } else if (loc.length < 5) {
    feedback.location = { status: "error", message: "Enter a more detailed venue address" };
  } else {
    feedback.location = { status: "ok", message: "Venue address looks good" };
  }

  return feedback;
}

export function getEventDayFeedback(
  day: EventDayInput,
  index: number,
  allDays: EventDayInput[]
): Partial<Record<"date" | "startTime" | "endTime", FieldFeedback>> {
  const out: Partial<Record<"date" | "startTime" | "endTime", FieldFeedback>> = {};
  const today = startOfDay(new Date());

  if (!day.date) {
    out.date = { status: "info", message: "Select when this session runs" };
  } else {
    const eventDate = startOfDay(day.date);
    if (eventDate < today) {
      out.date = { status: "error", message: "Event date cannot be in the past" };
    } else {
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 1);
      if (new Date(day.date) > maxFuture) {
        out.date = { status: "error", message: "Date is more than 1 year away" };
      } else {
        out.date = { status: "ok", message: eventDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" }) };
      }
    }
  }

  if (!day.startTime) {
    out.startTime = { status: "info", message: "When does the session start?" };
  }
  if (!day.endTime) {
    out.endTime = { status: "info", message: "When does the session end?" };
  }

  const range = resolveEventDayRange(day);
  if (range) {
    const diffHours = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      out.endTime = { status: "error", message: "Session cannot exceed 24 hours" };
    } else if (isOvernightSession(day)) {
      out.endTime = {
        status: "ok",
        message: `Overnight session — ends next day (${formatDurationHours(range.start, range.end)})`,
      };
      out.startTime = { status: "ok", message: `Starts ${formatDateTimeLabel(range.start)}` };
    } else {
      out.endTime = { status: "ok", message: `Duration: ${formatDurationHours(range.start, range.end)}` };
      out.startTime = { status: "ok", message: `Starts ${formatDateTimeLabel(range.start)}` };
    }
  }

  // Overlap on same calendar date
  if (day.date && day.startTime && day.endTime) {
    const r1 = resolveEventDayRange(day);
    if (r1) {
      allDays.forEach((other, j) => {
        if (j === index || other.date !== day.date) return;
        const r2 = resolveEventDayRange(other);
        if (!r2) return;
        const overlap = r1.start < r2.end && r1.end > r2.start;
        if (overlap) {
          out.startTime = {
            status: "error",
            message: `Overlaps with Day ${j + 1} on the same date`,
          };
        }
      });
    }
  }

  return out;
}

/** Process event days for API — same logic as backend */
export function processEventDaysForApi(
  eventDays: EventDayInput[]
): Array<{ date: Date; startTime: Date; endTime: Date }> | { error: string } {
  const processed: Array<{ date: Date; startTime: Date; endTime: Date }> = [];

  for (let i = 0; i < eventDays.length; i++) {
    const d = eventDays[i];
    if (!d.date || !d.startTime || !d.endTime) {
      return { error: `Complete date and times for Day ${i + 1}` };
    }

    const range = resolveEventDayRange(d);
    if (!range) {
      return { error: `Invalid date/time on Day ${i + 1}` };
    }

    const diffHours = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return { error: `Session on Day ${i + 1} exceeds 24 hours` };
    }

    processed.push({
      date: new Date(d.date),
      startTime: range.start,
      endTime: range.end,
    });
  }

  return processed;
}

export type StepValidationResult = {
  valid: boolean;
  /** Blocking message for toast */
  message?: string;
  /** First field name to focus */
  focusField?: string;
};

function hasErrorFeedback(fb: FieldFeedback | undefined): boolean {
  return fb?.status === "error";
}

/** Per-step gate before Continue — reuses live feedback helpers */
export function validateEventWizardStep(
  stepId: EventWizardStepId,
  form: EventFormInput
): StepValidationResult {
  const feedback = getEventFormFeedback(form);
  const dayInputs = form.eventDays ?? [];

  if (stepId === "basics") {
    if (hasErrorFeedback(feedback.title)) {
      return { valid: false, message: feedback.title!.message, focusField: "title" };
    }
    if (hasErrorFeedback(feedback.description)) {
      return { valid: false, message: feedback.description!.message, focusField: "description" };
    }
    if (!form.title.trim() || form.title.trim().length < 3) {
      return { valid: false, message: "Enter a title (at least 3 characters)", focusField: "title" };
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      return { valid: false, message: "Enter a description (at least 10 characters)", focusField: "description" };
    }
    return { valid: true };
  }

  if (stepId === "details") {
    if (hasErrorFeedback(feedback.location)) {
      return { valid: false, message: feedback.location!.message, focusField: "location" };
    }
    if (!form.location.trim()) {
      return { valid: false, message: "Location is required", focusField: "location" };
    }
    if (hasErrorFeedback(feedback.registrationStart)) {
      return { valid: false, message: feedback.registrationStart!.message, focusField: "registrationStart" };
    }
    if (hasErrorFeedback(feedback.registrationDeadline)) {
      return { valid: false, message: feedback.registrationDeadline!.message, focusField: "registrationDeadline" };
    }
    if (hasErrorFeedback(feedback.price)) {
      return { valid: false, message: feedback.price!.message, focusField: "investorPrice" };
    }
    if (hasErrorFeedback(feedback.freeGuestCount)) {
      return { valid: false, message: feedback.freeGuestCount!.message, focusField: "freeGuestCount" };
    }
    if (hasErrorFeedback(feedback.maxPerUser)) {
      return { valid: false, message: feedback.maxPerUser!.message, focusField: "maxPerUser" };
    }
    if (hasErrorFeedback(feedback.isRefundable)) {
      return { valid: false, message: feedback.isRefundable!.message, focusField: "isRefundable" };
    }
    if (form.isPaid) {
      const investorFee = !form.investorIsFree && (form.investorPrice ?? form.price) > 0;
      const guestFee = form.allowGuests && form.guestPaymentEnabled && form.guestPrice > 0;
      if (!investorFee && !guestFee) {
        return { valid: false, message: "Set investor and/or guest pricing for a paid event", focusField: "investorPrice" };
      }
    }
    return { valid: true };
  }

  if (stepId === "schedule") {
    if (!dayInputs.length) {
      return { valid: false, message: "Add at least one event day", focusField: "eventDays.0.date" };
    }

    for (let i = 0; i < dayInputs.length; i++) {
      const dayFb = getEventDayFeedback(
        dayInputs[i] ?? { date: null, startTime: null, endTime: null },
        i,
        dayInputs
      );
      if (hasErrorFeedback(dayFb.date)) {
        return { valid: false, message: dayFb.date!.message, focusField: `eventDays.${i}.date` };
      }
      if (hasErrorFeedback(dayFb.startTime)) {
        return { valid: false, message: dayFb.startTime!.message, focusField: `eventDays.${i}.startTime` };
      }
      if (hasErrorFeedback(dayFb.endTime)) {
        return { valid: false, message: dayFb.endTime!.message, focusField: `eventDays.${i}.endTime` };
      }
      const day = dayInputs[i];
      if (!day?.date || !day.startTime || !day.endTime) {
        return {
          valid: false,
          message: `Complete date and times for Day ${i + 1}`,
          focusField: `eventDays.${i}.date`,
        };
      }
    }
    return { valid: true };
  }

  // Ticket step — never blocks Continue/Publish
  return { valid: true };
}
