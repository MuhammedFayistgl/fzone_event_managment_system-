import { z } from "zod";

// ================= HELPERS =================
const combineDateTime = (date: string, time: string) => {
  return new Date(`${date}T${time}:00`); // ✅ FIXED (safe ISO)
};

const endOfDay = (date: string) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfDay = (date: string) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ================= SCHEMA =================
const eventDaySchema = z.object({
  date: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable()
});

export const eventSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .regex(/^[\p{L}0-9\s]+$/u, "Title should not contain special characters"), // ✅ multi-language support

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description too long"), // ✅ safe limit

    eventDays: z.array(eventDaySchema).min(1, "Add at least one event day"),

    // registrationStart: z.string().nullable(),
    // registrationDeadline: z.string().nullable(),

    isPaid: z.boolean(),

    price: z.number().default(0), // ✅ FIXED (NaN safe)

    isRefundable: z.boolean(),

    allowGuests: z.boolean(),

    maxPerUser: z.number().min(1, "Minimum 1 participant required"),

    locationType: z.enum(["online", "offline"]),

    location: z
      .string()
      .trim()
      .min(1, "Location required") // ✅ trim added
  })

  .superRefine((data, ctx) => {
    const now = new Date();

    // ✅ FIXED timezone safe
    const today = startOfDay(new Date().toDateString());

    let firstEventDate: Date | null = null;

    // ================= EVENT DAYS =================
    data.eventDays.forEach((day, i) => {
      if (!day.date) {
        ctx.addIssue({
          path: ["eventDays", i, "date"],
          code: "custom",
          message: "Please select event date"
        });
        return;
      }

      const eventDate = new Date(day.date);

      // ❗ Past date block
      if (startOfDay(day.date) < today) {
        ctx.addIssue({
          path: ["eventDays", i, "date"],
          code: "custom",
          message: "Event date cannot be in the past"
        });
      }

      // ❗ Future limit (1 year)
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 1);

      if (eventDate > maxFuture) {
        ctx.addIssue({
          path: ["eventDays", i, "date"],
          code: "custom",
          message: "Event date is too far in the future"
        });
      }

      if (!firstEventDate || eventDate < firstEventDate) {
        firstEventDate = eventDate;
      }

      if (!day.startTime) {
        ctx.addIssue({
          path: ["eventDays", i, "startTime"],
          code: "custom",
          message: "Select start time"
        });
      }

      if (!day.endTime) {
        ctx.addIssue({
          path: ["eventDays", i, "endTime"],
          code: "custom",
          message: "Select end time"
        });
      }

 if (day.startTime && day.endTime && day.date) {
  const start = combineDateTime(day.date, day.startTime);
  let end = combineDateTime(day.date, day.endTime);

  // ✅ If end is before start → assume next day
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  // ❌ Still invalid (safety check - extremely rare)
  if (end <= start) {
    ctx.addIssue({
      path: ["eventDays", i, "endTime"],
      code: "custom",
      message: "Invalid event time range"
    });
  }

  // ❌ Prevent weird long durations (optional but professional)
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (diffHours > 24) {
    ctx.addIssue({
      path: ["eventDays", i, "endTime"],
      code: "custom",
      message: "Event duration too long"
    });
  }
}
    });

    // ================= OVERLAPPING CHECK =================
    data.eventDays.forEach((day1, i) => {
      if (!day1.date || !day1.startTime || !day1.endTime) return;

      const start1 = combineDateTime(day1.date, day1.startTime);
      const end1 = combineDateTime(day1.date, day1.endTime);

      data.eventDays.forEach((day2, j) => {
        if (i === j || !day2.date || !day2.startTime || !day2.endTime) return;

        if (day1.date === day2.date) {
          const start2 = combineDateTime(day2.date, day2.startTime);
          const end2 = combineDateTime(day2.date, day2.endTime);

          const overlap = start1 < end2 && end1 > start2;

          if (overlap) {
            ctx.addIssue({
              path: ["eventDays", i, "startTime"],
              code: "custom",
              message: "Event time overlaps with another slot"
            });
          }
        }
      });
    });

    // ================= PRICE =================
    if (data.isPaid && data.price <= 0) {
      ctx.addIssue({
        path: ["price"],
        code: "custom",
        message: "Enter a valid price greater than 0"
      });
    }

    if (!data.isPaid && data.price > 0) {
      ctx.addIssue({
        path: ["price"],
        code: "custom",
        message: "Free event should not have a price"
      });
    }

    if (data.price > 100000) {
      ctx.addIssue({
        path: ["price"],
        code: "custom",
        message: "Price is too high"
      });
    }

    // ================= GUEST =================
    if (!data.allowGuests && data.maxPerUser > 1) {
      ctx.addIssue({
        path: ["maxPerUser"],
        code: "custom",
        message: "Guests disabled, so max per user must be 1"
      });
    }

    // ================= REFUND =================
    if (data.isRefundable && !data.isPaid) {
      ctx.addIssue({
        path: ["isRefundable"],
        code: "custom",
        message: "Free events cannot have refund option"
      });
    }

    // ================= LOCATION =================
    if (data.locationType === "online") {
      try {
        const url = new URL(data.location);

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        ctx.addIssue({
          path: ["location"],
          code: "custom",
          message: "Enter a valid secure meeting link (https://...)"
        });
      }
    }

    if (data.locationType === "offline") {
      if (data.location.length < 5) {
        ctx.addIssue({
          path: ["location"],
          code: "custom",
          message: "Enter a detailed venue location"
        });
      }
    }
  });