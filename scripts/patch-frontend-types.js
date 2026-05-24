const fs = require("fs");

function patch(file, search, replace) {
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes(search)) { console.error("MISS", file, search.slice(0, 60)); process.exit(1); }
  fs.writeFileSync(file, c.replace(search, replace));
  console.log("OK", file);
}

// event.ts
patch("frontend/src/Types/event.ts",
  "  isPaid: boolean;\r\n  price: number;\r\n  currency: string;",
  "  isPaid: boolean;\r\n  price: number;\r\n  investorIsFree?: boolean;\r\n  investorPrice?: number;\r\n  guestPaymentEnabled?: boolean;\r\n  guestPrice?: number;\r\n  freeGuestCount?: number;\r\n  currency: string;");

patch("frontend/src/Types/event.ts",
  "  isPaid: boolean;\r\n  price: number;\r\n\r\n  isRefundable: boolean;",
  "  isPaid: boolean;\r\n  price: number;\r\n  investorIsFree?: boolean;\r\n  investorPrice?: number;\r\n  guestPaymentEnabled?: boolean;\r\n  guestPrice?: number;\r\n  freeGuestCount?: number;\r\n\r\n  isRefundable: boolean;");

// EventSlice
patch("frontend/src/redux/EventSlice.ts",
  "  isPaid: boolean;\r\n  price: number;\r\n  isRefundable: boolean;\r\n  allowGuests: boolean;",
  "  isPaid: boolean;\r\n  price: number;\r\n  investorIsFree: boolean;\r\n  investorPrice: number;\r\n  guestPaymentEnabled: boolean;\r\n  guestPrice: number;\r\n  freeGuestCount: number;\r\n  isRefundable: boolean;\r\n  allowGuests: boolean;");

patch("frontend/src/redux/EventSlice.ts",
  "  isPaid: boolean;\r\n  price: number;\r\n  eventDays?: any[];",
  "  isPaid: boolean;\r\n  price: number;\r\n  investorIsFree?: boolean;\r\n  investorPrice?: number;\r\n  guestPaymentEnabled?: boolean;\r\n  guestPrice?: number;\r\n  freeGuestCount?: number;\r\n  eventDays?: any[];");

patch("frontend/src/redux/EventSlice.ts",
  "    isPaid: false,\r\n    price: 0,\r\n    isRefundable: false,",
  "    isPaid: false,\r\n    price: 0,\r\n    investorIsFree: false,\r\n    investorPrice: 0,\r\n    guestPaymentEnabled: false,\r\n    guestPrice: 0,\r\n    freeGuestCount: 0,\r\n    isRefundable: false,");

// eventSchema
patch("frontend/src/validators/eventSchema.ts",
  "    isPaid: z.boolean(),\r\n\r\n    price: z.number().default(0),",
  "    isPaid: z.boolean(),\r\n\r\n    price: z.number().default(0),\r\n    investorIsFree: z.boolean().default(false),\r\n    investorPrice: z.number().default(0),\r\n    guestPaymentEnabled: z.boolean().default(false),\r\n    guestPrice: z.number().default(0),\r\n    freeGuestCount: z.number().min(0).default(0),");

const oldPriceValidation = `    // ================= PRICE =================\r\n    if (data.isPaid && data.price <= 0) {\r\n      ctx.addIssue({\r\n        path: ["price"],\r\n        code: "custom",\r\n        message: "Enter a valid price greater than 0"\r\n      });\r\n    }\r\n\r\n    if (!data.isPaid && data.price > 0) {\r\n      ctx.addIssue({\r\n        path: ["price"],\r\n        code: "custom",\r\n        message: "Free event should not have a price"\r\n      });\r\n    }\r\n\r\n    if (data.price > 100000) {\r\n      ctx.addIssue({\r\n        path: ["price"],\r\n        code: "custom",\r\n        message: "Price is too high"\r\n      });\r\n    }`;

const newPriceValidation = `    // ================= PRICE =================\r\n    if (!data.isPaid) {\r\n      if (data.price > 0 || data.investorPrice > 0 || data.guestPrice > 0) {\r\n        ctx.addIssue({ path: ["price"], code: "custom", message: "Free event should not have pricing" });\r\n      }\r\n    } else {\r\n      const hasInvestorFee = !data.investorIsFree && (data.investorPrice ?? data.price) > 0;\r\n      const hasGuestFee = data.allowGuests && data.guestPaymentEnabled && data.guestPrice > 0;\r\n      if (!hasInvestorFee && !hasGuestFee) {\r\n        ctx.addIssue({ path: ["price"], code: "custom", message: "Set investor and/or guest pricing" });\r\n      }\r\n      if (!data.investorIsFree && (data.investorPrice ?? data.price) <= 0) {\r\n        ctx.addIssue({ path: ["investorPrice"], code: "custom", message: "Enter investor price or mark entry free" });\r\n      }\r\n      if (data.guestPaymentEnabled && data.guestPrice <= 0) {\r\n        ctx.addIssue({ path: ["guestPrice"], code: "custom", message: "Enter guest price" });\r\n      }\r\n      if (data.guestPaymentEnabled && data.freeGuestCount > data.maxPerUser) {\r\n        ctx.addIssue({ path: ["freeGuestCount"], code: "custom", message: "Free guest count exceeds max per registration" });\r\n      }\r\n    }\r\n\r\n    const maxPrice = Math.max(data.price, data.investorPrice ?? 0, data.guestPrice ?? 0);\r\n    if (maxPrice > 100000) {\r\n      ctx.addIssue({ path: ["price"], code: "custom", message: "Price is too high" });\r\n    }`;

patch("frontend/src/validators/eventSchema.ts", oldPriceValidation, newPriceValidation);

// EventThunks
patch("frontend/src/redux/EventThunks.ts",
  "interface CreateOrderPayload {\r\n  eventId: string;\r\n  phone: string;\r\n};",
  "interface CreateOrderPayload {\r\n  eventId: string;\r\n  phone: string;\r\n  guestCount?: number;\r\n};");
