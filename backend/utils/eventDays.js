/** Normalize and validate event day payloads (create + update) */

export function processEventDays(eventDays) {
  if (!Array.isArray(eventDays) || eventDays.length === 0) {
    return { error: "At least one event day required" };
  }

  const processed = [];

  for (let i = 0; i < eventDays.length; i++) {
    const d = eventDays[i];

    if (!d.date || !d.startTime || !d.endTime) {
      return { error: `Complete date and times for Day ${i + 1}` };
    }

    const start = new Date(`${d.date}T${d.startTime}`);
    let end = new Date(`${d.date}T${d.endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: `Invalid date/time format on Day ${i + 1}` };
    }

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    if (end <= start) {
      return { error: `Invalid time range on Day ${i + 1}` };
    }

    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return { error: `Session on Day ${i + 1} exceeds 24 hours` };
    }

    processed.push({
      date: new Date(d.date),
      startTime: start,
      endTime: end,
    });
  }

  // Same-calendar-day overlap check
  for (let i = 0; i < processed.length; i++) {
    for (let j = i + 1; j < processed.length; j++) {
      const a = processed[i];
      const b = processed[j];
      const sameDay =
        a.date.toISOString().slice(0, 10) === b.date.toISOString().slice(0, 10);
      if (!sameDay) continue;
      const overlap = a.startTime < b.endTime && a.endTime > b.startTime;
      if (overlap) {
        return { error: `Day ${i + 1} overlaps with Day ${j + 1}` };
      }
    }
  }

  return { days: processed };
}

export function getScheduleBounds(processedDays) {
  if (!processedDays?.length) return null;
  return {
    firstStart: new Date(Math.min(...processedDays.map((d) => d.startTime.getTime()))),
    lastEnd: new Date(Math.max(...processedDays.map((d) => d.endTime.getTime()))),
  };
}

export function validateRegistrationWindow(registrationStart, registrationDeadline, scheduleBounds) {
  if (registrationStart && registrationDeadline) {
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationDeadline);

    if (Number.isNaN(regStart.getTime()) || Number.isNaN(regEnd.getTime())) {
      return "Invalid registration date/time";
    }

    if (regEnd <= regStart) {
      return "Registration must close after it opens";
    }
  }

  if (scheduleBounds) {
    if (registrationStart) {
      const regStart = new Date(registrationStart);
      if (!Number.isNaN(regStart.getTime()) && regStart > scheduleBounds.lastEnd) {
        return "Registration cannot open after the event has ended";
      }
    }
    if (registrationDeadline) {
      const regEnd = new Date(registrationDeadline);
      if (!Number.isNaN(regEnd.getTime()) && regEnd > scheduleBounds.lastEnd) {
        return "Registration cannot close after the event has ended";
      }
    }
  }

  return null;
}
