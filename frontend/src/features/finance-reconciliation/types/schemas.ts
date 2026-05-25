import { z } from "zod";

export const filterSchema = z.object({
  eventId: z.string().optional(),
  status: z.string().default("all"),
  reconciliationStatus: z
    .enum(["all", "matched", "pending", "failed", "mismatch", "refunded"])
    .default("all"),
  settlementStatus: z.enum(["all", "settled", "pending", "unknown"]).default("all"),
  method: z.string().default("all"),
  dateRange: z.enum(["today", "7d", "30d", "all", "custom"]).default("30d"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.string().optional(),
  amountMax: z.string().optional(),
  search: z.string().optional(),
});

export const resolveSchema = z.object({
  note: z.string().max(500).optional(),
});

export type FilterFormValues = z.infer<typeof filterSchema>;
export type ResolveFormValues = z.infer<typeof resolveSchema>;
