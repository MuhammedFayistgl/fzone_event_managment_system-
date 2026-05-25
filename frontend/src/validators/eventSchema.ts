import { z } from "zod";
import {
  getEventScheduleBounds,
  resolveEventDayRange,
  startOfDay,
} from "../utils/eventFormValidation";

const eventDaySchema = z.object({
  date: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
});

export const eventSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(80, "Title cannot exceed 80 characters")
      .regex(/^[\p{L}0-9\s]+$/u, "Title should not contain special characters"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description cannot exceed 500 characters"),

    eventDays: z.array(eventDaySchema).min(1, "Add at least one event day"),

    registrationStart: z.string().nullable().optional(),
    registrationDeadline: z.string().nullable().optional(),

    isPaid: z.boolean(),

    price: z.number().default(0),
    investorIsFree: z.boolean().default(false),
    investorPrice: z.number().default(0),
    guestPaymentEnabled: z.boolean().default(false),
    guestPrice: z.number().default(0),
    freeGuestCount: z.number().min(0).default(0),

    isRefundable: z.boolean(),

    allowGuests: z.boolean(),

    maxPerUser: z.number().min(1, "Minimum 1 participant required"),

    maxParticipants: z.number().min(0, "Cannot be negative").default(0),

    locationType: z.enum(["online", "offline"]),

    location: z.string().trim().min(1, "Location required"),
  })

  .superRefine((data, ctx) => {
    const today = startOfDay(new Date());

    data.eventDays.forEach((day, i) => {
      if (!day.date) {
        ctx.addIssue({
          path: ["eventDays", i, "date"],
          code: "custom",
          message: "Please select event date",
        });
        return;
      }

      const eventDate = new Date(day.date);

      if (startOfDay(day.date) < today) {
        ctx.addIssue({
          path: ["eventDays", i, "date"],
          code: "custom",
          message: "Event date cannot be in the past",
        });
      }

      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 1);

      if (eventDate > maxFuture) {
        ctx.addIssue({
          path: ["eventDays", i, "date"],
          code: "custom",
          message: "Event date is too far in the future",
        });
      }

      if (!day.startTime) {
        ctx.addIssue({
          path: ["eventDays", i, "startTime"],
          code: "custom",
          message: "Select start time",
        });
      }

      if (!day.endTime) {
        ctx.addIssue({
          path: ["eventDays", i, "endTime"],
          code: "custom",
          message: "Select end time",
        });
      }

      if (day.startTime && day.endTime && day.date) {
        const range = resolveEventDayRange(day);
        if (!range) {
          ctx.addIssue({
            path: ["eventDays", i, "endTime"],
            code: "custom",
            message: "Invalid date or time",
          });
          return;
        }

        const diffHours = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60);
        if (diffHours > 24) {
          ctx.addIssue({
            path: ["eventDays", i, "endTime"],
            code: "custom",
            message: "Session cannot exceed 24 hours",
          });
        }
      }
    });

    // Overlap check (uses overnight-adjusted ranges)
    data.eventDays.forEach((day1, i) => {
      const r1 = resolveEventDayRange(day1);
      if (!r1) return;

      data.eventDays.forEach((day2, j) => {
        if (i >= j) return;
        const r2 = resolveEventDayRange(day2);
        if (!r2) return;

        if (day1.date === day2.date) {
          const overlap = r1.start < r2.end && r1.end > r2.start;
          if (overlap) {
            ctx.addIssue({
              path: ["eventDays", i, "startTime"],
              code: "custom",
              message: `Time overlaps with Day ${j + 1}`,
            });
          }
        }
      });
    });

    const schedule = getEventScheduleBounds(data.eventDays);

    if (data.registrationStart && data.registrationDeadline) {
      const regStart = new Date(data.registrationStart);
      const regEnd = new Date(data.registrationDeadline);

      if (Number.isNaN(regStart.getTime())) {
        ctx.addIssue({
          path: ["registrationStart"],
          code: "custom",
          message: "Invalid registration opening date",
        });
      }
      if (Number.isNaN(regEnd.getTime())) {
        ctx.addIssue({
          path: ["registrationDeadline"],
          code: "custom",
          message: "Invalid registration closing date",
        });
      }

      if (!Number.isNaN(regStart.getTime()) && !Number.isNaN(regEnd.getTime()) && regEnd <= regStart) {
        ctx.addIssue({
          path: ["registrationDeadline"],
          code: "custom",
          message: "Registration must close after it opens",
        });
        ctx.addIssue({
          path: ["registrationStart"],
          code: "custom",
          message: "Registration must open before it closes",
        });
      }
    }

    if (schedule) {
      if (data.registrationStart) {
        const regStart = new Date(data.registrationStart);
        if (!Number.isNaN(regStart.getTime()) && regStart > schedule.lastEnd) {
          ctx.addIssue({
            path: ["registrationStart"],
            code: "custom",
            message: "Registration cannot open after the event has ended",
          });
        }
      }

      if (data.registrationDeadline) {
        const regEnd = new Date(data.registrationDeadline);
        if (!Number.isNaN(regEnd.getTime()) && regEnd > schedule.lastEnd) {
          ctx.addIssue({
            path: ["registrationDeadline"],
            code: "custom",
            message: "Registration cannot close after the event has ended",
          });
        }
      }
    }

    if (!data.isPaid) {
      if (data.price > 0 || data.investorPrice > 0 || data.guestPrice > 0) {
        ctx.addIssue({ path: ["price"], code: "custom", message: "Free event should not have pricing" });
      }
    } else {
      const hasInvestorFee = !data.investorIsFree && (data.investorPrice ?? data.price) > 0;
      const hasGuestFee = data.allowGuests && data.guestPaymentEnabled && data.guestPrice > 0;
      if (!hasInvestorFee && !hasGuestFee) {
        ctx.addIssue({ path: ["price"], code: "custom", message: "Set investor and/or guest pricing" });
      }
      if (!data.investorIsFree && (data.investorPrice ?? data.price) <= 0) {
        ctx.addIssue({ path: ["investorPrice"], code: "custom", message: "Enter investor price or mark entry free" });
      }
      if (data.guestPaymentEnabled && data.guestPrice <= 0) {
        ctx.addIssue({ path: ["guestPrice"], code: "custom", message: "Enter guest price" });
      }
      if (data.guestPaymentEnabled && data.freeGuestCount > data.maxPerUser) {
        ctx.addIssue({
          path: ["freeGuestCount"],
          code: "custom",
          message: "Free guest count exceeds max per registration",
        });
      }
    }

    const maxPrice = Math.max(data.price, data.investorPrice ?? 0, data.guestPrice ?? 0);
    if (maxPrice > 100000) {
      ctx.addIssue({ path: ["price"], code: "custom", message: "Price is too high" });
    }

    if (!data.allowGuests && data.maxPerUser > 1) {
      ctx.addIssue({
        path: ["maxPerUser"],
        code: "custom",
        message: "Guests disabled, so max per user must be 1",
      });
    }

    if (data.isRefundable && !data.isPaid) {
      ctx.addIssue({
        path: ["isRefundable"],
        code: "custom",
        message: "Free events cannot have refund option",
      });
    }

    if (data.locationType === "online") {
      try {
        const url = new URL(data.location);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        ctx.addIssue({
          path: ["location"],
          code: "custom",
          message: "Enter a valid secure meeting link (https://...)",
        });
      }
    }

    if (data.locationType === "offline" && data.location.length < 5) {
      ctx.addIssue({
        path: ["location"],
        code: "custom",
        message: "Enter a detailed venue location",
      });
    }
  });
