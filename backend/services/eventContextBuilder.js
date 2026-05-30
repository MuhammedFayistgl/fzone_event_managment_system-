import eventModel from "../models/eventModel.js";

function formatPricing(event) {
  if (!event.isPaid) return "Free event";

  const parts = [];
  if (event.investorIsFree) parts.push("Investor: Free");
  else if (event.investorPrice > 0) parts.push(`Investor: INR ${event.investorPrice}`);
  else if (event.price > 0) parts.push(`Investor: INR ${event.price}`);

  if (event.allowGuests) {
    if (event.guestPaymentEnabled && event.guestPrice > 0) {
      parts.push(`Guest: INR ${event.guestPrice}`);
    } else if (event.freeGuestCount > 0) {
      parts.push(`${event.freeGuestCount} free guest(s)`);
    } else {
      parts.push("Guests: check event rules");
    }
  }
  return parts.join(" · ") || "Paid event";
}

export async function buildEventContext(eventId) {
  if (!eventId) return null;

  const event = await eventModel.findById(eventId).lean();
  if (!event) return null;

  const firstDay = event.eventDays?.[0];
  const now = new Date();
  const regClosed =
    Boolean(event.isRegistrationClosed) ||
    (event.registrationDeadline && new Date(event.registrationDeadline) < now) ||
    (event.registrationStart && new Date(event.registrationStart) > now);

  return {
    eventId: String(event._id),
    title: event.title,
    description: event.description?.slice(0, 300) || "",
    location: event.location,
    locationType: event.locationType,
    allowGuests: Boolean(event.allowGuests),
    maxPerUser: event.maxPerUser,
    isPaid: Boolean(event.isPaid),
    isRegistrationClosed: regClosed,
    registrationDeadline: event.registrationDeadline,
    registrationStart: event.registrationStart,
    pricingSummary: formatPricing(event),
    eventDate: firstDay?.date || null,
  };
}
