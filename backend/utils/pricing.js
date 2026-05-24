/**
 * Split investor / guest pricing helpers.
 */

export function normalizeEventPricing(event) {
  if (!event) {
    return {
      isPaid: false,
      price: 0,
      investorIsFree: true,
      investorPrice: 0,
      guestPaymentEnabled: false,
      guestPrice: 0,
      freeGuestCount: 0,
      allowGuests: false,
    };
  }
  const plain = event.toObject ? event.toObject() : { ...event };
  if (plain.investorPrice == null && plain.price != null) plain.investorPrice = plain.price;
  if (plain.isPaid && Number(plain.price) > 0 && Number(plain.investorPrice) === 0 && !plain.guestPaymentEnabled) {
    plain.investorPrice = Number(plain.price);
    plain.investorIsFree = false;
  }
  plain.investorPrice = Number(plain.investorPrice ?? 0);
  plain.guestPrice = Number(plain.guestPrice ?? 0);
  plain.freeGuestCount = Number(plain.freeGuestCount ?? 0);
  plain.investorIsFree = Boolean(plain.investorIsFree);
  plain.guestPaymentEnabled = Boolean(plain.guestPaymentEnabled);
  if (!plain.isPaid) {
    plain.investorPrice = 0; plain.guestPrice = 0; plain.freeGuestCount = 0;
    plain.investorIsFree = true; plain.guestPaymentEnabled = false; plain.price = 0;
    return plain;
  }
  if (!plain.allowGuests) { plain.guestPaymentEnabled = false; plain.guestPrice = 0; plain.freeGuestCount = 0; }
  if (!plain.guestPaymentEnabled) { plain.guestPrice = 0; plain.freeGuestCount = 0; }
  plain.price = plain.investorIsFree ? 0 : plain.investorPrice;
  return plain;
}

export function calculateRegistrationTotal(event, guestCount = 0) {
  const e = normalizeEventPricing(event);
  const guests = Math.max(0, Number(guestCount) || 0);
  if (!e.isPaid) {
    return { total: 0, breakdown: { investorAmount: 0, guestAmount: 0, guestCount: guests, payableGuestCount: 0, freeGuestCount: 0, investorIsFree: true, guestPaymentEnabled: false } };
  }
  const investorAmount = e.investorIsFree ? 0 : e.investorPrice;
  let guestAmount = 0, payableGuestCount = 0;
  if (e.allowGuests && e.guestPaymentEnabled && guests > 0) {
    payableGuestCount = Math.max(0, guests - e.freeGuestCount);
    guestAmount = payableGuestCount * e.guestPrice;
  }
  return { total: investorAmount + guestAmount, breakdown: { investorAmount, guestAmount, guestCount: guests, payableGuestCount, freeGuestCount: e.freeGuestCount, investorIsFree: e.investorIsFree, guestPaymentEnabled: e.guestPaymentEnabled } };
}

export function paymentRequired(event, guestCount = 0) {
  return calculateRegistrationTotal(event, guestCount).total > 0;
}

export function applyPricingToPayload(data) {
  const payload = { ...data };
  if (!payload.isPaid) {
    payload.price = 0; payload.investorPrice = 0; payload.guestPrice = 0; payload.freeGuestCount = 0;
    payload.investorIsFree = true; payload.guestPaymentEnabled = false; return payload;
  }
  payload.investorPrice = Number(payload.investorPrice ?? payload.price ?? 0);
  payload.investorIsFree = Boolean(payload.investorIsFree);
  payload.guestPaymentEnabled = Boolean(payload.guestPaymentEnabled);
  payload.guestPrice = Number(payload.guestPrice ?? 0);
  payload.freeGuestCount = Math.max(0, Number(payload.freeGuestCount ?? 0));
  if (!payload.allowGuests) { payload.guestPaymentEnabled = false; payload.guestPrice = 0; payload.freeGuestCount = 0; }
  if (!payload.guestPaymentEnabled) { payload.guestPrice = 0; payload.freeGuestCount = 0; }
  if (payload.investorIsFree) payload.investorPrice = 0;
  payload.price = payload.investorIsFree ? 0 : payload.investorPrice;
  return payload;
}

export function validatePricingPayload(data) {
  const errors = [];
  if (!data.isPaid) return errors;
  const hasInvestorFee = !data.investorIsFree && Number(data.investorPrice ?? data.price ?? 0) > 0;
  const hasGuestFee = data.allowGuests && data.guestPaymentEnabled && Number(data.guestPrice ?? 0) > 0;
  if (!hasInvestorFee && !hasGuestFee) errors.push("Paid event needs investor price and/or guest pricing");
  if (!data.investorIsFree && Number(data.investorPrice ?? data.price ?? 0) <= 0) errors.push("Enter a valid investor price or mark investor entry as free");
  if (data.guestPaymentEnabled && Number(data.guestPrice ?? 0) <= 0) errors.push("Enter a valid guest price");
  if (data.guestPaymentEnabled && Number(data.freeGuestCount ?? 0) > Number(data.maxPerUser ?? 0)) errors.push("Free guest count cannot exceed max guests per registration");
  return errors;
}

export function sumSuccessfulPayments(payments = []) {
  return payments
    .filter((p) => !p.status || p.status === "success")
    .reduce(
      (sum, p) =>
        sum + Math.max(0, Number(p.amount || 0) - Number(p.refundAmount || 0)),
      0
    );
}
