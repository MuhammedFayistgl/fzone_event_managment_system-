export type PricingBreakdown = {
  investorAmount: number;
  guestAmount: number;
  guestCount: number;
  payableGuestCount: number;
  freeGuestCount: number;
  investorIsFree: boolean;
  guestPaymentEnabled: boolean;
};

export type EventPricingFields = {
  isPaid?: boolean;
  price?: number;
  investorIsFree?: boolean;
  investorPrice?: number;
  guestPaymentEnabled?: boolean;
  guestPrice?: number;
  freeGuestCount?: number;
  allowGuests?: boolean;
  maxPerUser?: number;
};

const DEFAULT_PRICING: EventPricingFields = {
  isPaid: false,
  price: 0,
  investorIsFree: true,
  investorPrice: 0,
  guestPaymentEnabled: false,
  guestPrice: 0,
  freeGuestCount: 0,
  allowGuests: false,
};

export function normalizeEventPricing(
  event: EventPricingFields | null | undefined
): EventPricingFields {
  if (!event) return { ...DEFAULT_PRICING };

  const plain = { ...event };

  if (plain.investorPrice == null && plain.price != null) {
    plain.investorPrice = plain.price;
  }

  if (
    plain.isPaid &&
    Number(plain.price) > 0 &&
    Number(plain.investorPrice) === 0 &&
    !plain.guestPaymentEnabled
  ) {
    plain.investorPrice = Number(plain.price);
    plain.investorIsFree = false;
  }

  plain.investorPrice = Number(plain.investorPrice ?? 0);
  plain.guestPrice = Number(plain.guestPrice ?? 0);
  plain.freeGuestCount = Number(plain.freeGuestCount ?? 0);
  plain.investorIsFree = Boolean(plain.investorIsFree);
  plain.guestPaymentEnabled = Boolean(plain.guestPaymentEnabled);

  if (!plain.isPaid) {
    return {
      ...plain,
      investorPrice: 0,
      guestPrice: 0,
      freeGuestCount: 0,
      investorIsFree: true,
      guestPaymentEnabled: false,
      price: 0,
    };
  }

  if (!plain.allowGuests) {
    plain.guestPaymentEnabled = false;
    plain.guestPrice = 0;
    plain.freeGuestCount = 0;
  }

  if (!plain.guestPaymentEnabled) {
    plain.guestPrice = 0;
    plain.freeGuestCount = 0;
  }

  plain.price = plain.investorIsFree ? 0 : plain.investorPrice;
  return plain;
}

export function calculateRegistrationTotal(
  event: EventPricingFields | null | undefined,
  guestCount = 0
) {
  const e = normalizeEventPricing(event);
  const guests = Math.max(0, Number(guestCount) || 0);

  if (!e.isPaid) {
    return {
      total: 0,
      breakdown: {
        investorAmount: 0,
        guestAmount: 0,
        guestCount: guests,
        payableGuestCount: 0,
        freeGuestCount: 0,
        investorIsFree: true,
        guestPaymentEnabled: false,
      },
    };
  }

  const investorAmount = e.investorIsFree ? 0 : (e.investorPrice ?? 0);
  let guestAmount = 0;
  let payableGuestCount = 0;

  if (e.allowGuests && e.guestPaymentEnabled && guests > 0) {
    payableGuestCount = Math.max(0, guests - (e.freeGuestCount ?? 0));
    guestAmount = payableGuestCount * (e.guestPrice ?? 0);
  }

  return {
    total: investorAmount + guestAmount,
    breakdown: {
      investorAmount,
      guestAmount,
      guestCount: guests,
      payableGuestCount,
      freeGuestCount: e.freeGuestCount ?? 0,
      investorIsFree: !!e.investorIsFree,
      guestPaymentEnabled: !!e.guestPaymentEnabled,
    },
  };
}

export function paymentRequired(
  event: EventPricingFields | null | undefined,
  guestCount = 0
) {
  return calculateRegistrationTotal(event, guestCount).total > 0;
}

export function formatEventPricingLabel(
  event: EventPricingFields | null | undefined
) {
  const e = normalizeEventPricing(event);
  if (!e.isPaid) return "Free";

  const parts: string[] = [];
  if (!e.investorIsFree && (e.investorPrice ?? 0) > 0) {
    parts.push(`Investor ₹${e.investorPrice}`);
  } else if (e.investorIsFree) {
    parts.push("Investor free");
  }

  if (e.allowGuests && e.guestPaymentEnabled) {
    const free = e.freeGuestCount ? `, first ${e.freeGuestCount} guest(s) free` : "";
    parts.push(`Guest ₹${e.guestPrice}${free}`);
  }

  return parts.join(" · ") || `₹${e.price ?? 0}`;
}

export type EventPricingTier = "free" | "investorPaid" | "guestPaid" | "mixed";

export function getEventPricingTier(
  event: EventPricingFields | null | undefined
): EventPricingTier {
  const e = normalizeEventPricing(event);
  if (!e.isPaid) return "free";

  const hasInvestorFee = !e.investorIsFree && (e.investorPrice ?? 0) > 0;
  const hasGuestFee =
    e.allowGuests && e.guestPaymentEnabled && (e.guestPrice ?? 0) > 0;

  if (hasInvestorFee && hasGuestFee) return "mixed";
  if (hasGuestFee && e.investorIsFree) return "guestPaid";
  if (hasInvestorFee) return "investorPaid";
  if (hasGuestFee) return "guestPaid";
  return "investorPaid";
}

export function formatPaymentBreakdownLines(
  breakdown: PricingBreakdown | null | undefined,
  event?: EventPricingFields | null
) {
  if (!breakdown) return [];

  const lines: string[] = [];
  if (!breakdown.investorIsFree && breakdown.investorAmount > 0) {
    lines.push(`Investor entry: ₹${breakdown.investorAmount}`);
  }
  if (breakdown.guestPaymentEnabled) {
    const freeNote = breakdown.freeGuestCount
      ? ` (first ${breakdown.freeGuestCount} free)`
      : "";
    lines.push(
      `Guests (${breakdown.guestCount}${freeNote}): ₹${breakdown.guestAmount}`
    );
    if (breakdown.payableGuestCount > 0 && event?.guestPrice) {
      lines.push(
        `${breakdown.payableGuestCount} payable × ₹${event.guestPrice}`
      );
    }
  }
  return lines;
}

export function getRegistrationPaymentStatus(
  event: EventPricingFields | null | undefined,
  guestCount: number,
  paidTotal: number
) {
  const { total: requiredTotal, breakdown } = calculateRegistrationTotal(
    event,
    guestCount
  );
  const requiresPayment = requiredTotal > 0;
  const amountDue = Math.max(0, requiredTotal - paidTotal);
  const isSufficient = !requiresPayment || paidTotal >= requiredTotal;

  return {
    requiresPayment,
    isSufficient,
    requiredTotal,
    amountDue,
    paidTotal,
    breakdown,
  };
}

export function formatCurrency(amount: number) {
  return `₹ ${Math.max(0, Number(amount) || 0).toLocaleString("en-IN")}`;
}

export function isPaymentSufficient(
  event: EventPricingFields | null | undefined,
  guestCount: number,
  paidTotal: number
) {
  const { total } = calculateRegistrationTotal(event, guestCount);
  if (total <= 0) return true;
  return paidTotal >= total;
}

export type GuestPaymentStatus = "free" | "paid" | "due";

export type GuestAccessStatus = "allowed" | "blocked" | GuestPaymentStatus;

export function computeAccessCoverage(
  event: EventPricingFields | null | undefined,
  paidTotal: number,
  guestCount: number
) {
  const guests = Math.max(0, Number(guestCount) || 0);
  const paid = Math.max(0, Number(paidTotal) || 0);

  const { total: investorRequired } = calculateRegistrationTotal(event, 0);
  const investorCovered = paid >= investorRequired - 0.001;

  const guestCovered: boolean[] = [];
  for (let i = 1; i <= guests; i++) {
    const { total: cumulative } = calculateRegistrationTotal(event, i);
    const { total: prev } = calculateRegistrationTotal(event, i - 1);
    const marginal = cumulative - prev;

    if (marginal <= 0) {
      guestCovered.push(true);
    } else {
      guestCovered.push(paid >= cumulative - 0.001);
    }
  }

  const { total: requiredTotal } = calculateRegistrationTotal(event, guests);
  const coveredGuestCount = guestCovered.filter(Boolean).length;
  const guestsBlocked = guestCovered
    .map((covered, index) => (!covered ? index + 1 : null))
    .filter((value): value is number => value != null);

  return {
    investorCovered,
    investorBlocked: !investorCovered,
    guestCovered,
    guestsBlocked,
    paidTotal: paid,
    requiredTotal,
    coveredGuestCount,
  };
}

export function getGuestAccessStatuses(
  event: EventPricingFields | null | undefined,
  guestCount: number,
  paidTotal: number,
  participants: Array<{ isBlocked?: boolean }> = []
): GuestAccessStatus[] {
  const payStatuses = getGuestPaymentStatuses(event, guestCount, paidTotal);

  return payStatuses.map((status, index) => {
    if (participants[index]?.isBlocked) return "blocked";
    if (status === "due") return "due";
    if (status === "paid" || status === "free") return "allowed";
    return status;
  });
}

export function getMarginalGuestCost(
  event: EventPricingFields | null | undefined,
  fromGuestCount: number,
  toGuestCount: number
) {
  const { total: toTotal } = calculateRegistrationTotal(event, toGuestCount);
  const { total: fromTotal } = calculateRegistrationTotal(event, fromGuestCount);
  return Math.max(0, toTotal - fromTotal);
}

export function getGuestPaymentStatuses(
  event: EventPricingFields | null | undefined,
  guestCount: number,
  paidTotal: number
): GuestPaymentStatus[] {
  const count = Math.max(0, Number(guestCount) || 0);
  const statuses: GuestPaymentStatus[] = [];

  for (let i = 1; i <= count; i++) {
    const { total: cumulative } = calculateRegistrationTotal(event, i);
    const { total: prev } = calculateRegistrationTotal(event, i - 1);
    const marginal = cumulative - prev;

    if (marginal <= 0) {
      statuses.push("free");
    } else if (paidTotal >= cumulative) {
      statuses.push("paid");
    } else {
      statuses.push("due");
    }
  }

  return statuses;
}

export type UserRefundStatus = "none" | "partial" | "full" | "pending";

export type UserRefundEntry = {
  amount: number;
  status: "pending" | "processed" | "failed";
  processedAt?: string | null;
  initiatedAt?: string | null;
};

export type SuccessPaymentRecord = {
  amount?: number;
  netAmount?: number;
  refundAmount?: number;
  refundStatus?: UserRefundStatus;
  guestCount?: number;
  paidAt?: string;
  razorpay_order_id?: string;
  orderId?: string;
};
