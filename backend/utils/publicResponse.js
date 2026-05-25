import { sanitizeBlockedReasonForUser } from "./paymentRefund.js";

/** Public investor lookup — minimal fields only. */
export function sanitizeInvestorPublic(investor) {
  if (!investor) return null;
  const doc = investor.toObject ? investor.toObject() : investor;
  return {
    _id: doc._id,
    Name: doc.Name,
    Code_No: doc.Code_No,
    Phone_No: doc.Phone_No,
    Gender: doc.Gender,
  };
}

/** Registration doc for authenticated phone owner (includes pass QR data). */
export function sanitizeRegistrationForOwner(registration) {
  if (!registration) return null;
  const doc = registration.toObject ? registration.toObject() : { ...registration };

  return {
    _id: doc._id,
    eventId: doc.eventId,
    phone: doc.phone,
    investorName: doc.investorName,
    investorCode: doc.investorCode,
    isCheckedIn: Boolean(doc.isCheckedIn),
    checkedInAt: doc.checkedInAt,
    isBlocked: Boolean(doc.isBlocked),
    blockedReason: doc.isBlocked
      ? sanitizeBlockedReasonForUser(doc.blockedReason)
      : "",
    qrToken: doc.qrToken,
    qrCodeImage: doc.qrCodeImage,
    participants: (doc.participants || []).map((p) => ({
      _id: p._id,
      name: p.name,
      phone: p.phone,
      type: p.type,
      gender: p.gender,
      isCheckedIn: Boolean(p.isCheckedIn),
      checkedInAt: p.checkedInAt,
      isBlocked: Boolean(p.isBlocked),
      blockedReason: p.isBlocked
        ? sanitizeBlockedReasonForUser(p.blockedReason)
        : "",
      qrToken: p.qrToken,
      qrCodeImage: p.qrCodeImage,
    })),
  };
}

/** Status check — no QR tokens (enumeration hardening). */
export function sanitizeRegistrationStatus(registration) {
  if (!registration) return null;
  const doc = registration.toObject ? registration.toObject() : registration;
  return {
    _id: doc._id,
    registered: true,
    isBlocked: Boolean(doc.isBlocked),
    blockedReason: doc.isBlocked
      ? sanitizeBlockedReasonForUser(doc.blockedReason)
      : "",
    participantCount: (doc.participants || []).length,
  };
}

/** Public event payload — allowlisted fields only. */
export function sanitizeEventPublic(event) {
  if (!event) return null;
  const doc = event.toObject ? event.toObject() : event;
  return {
    _id: doc._id,
    title: doc.title,
    description: doc.description,
    eventDays: doc.eventDays,
    maxParticipants: doc.maxParticipants,
    registeredCount: doc.registeredCount,
    maxPerUser: doc.maxPerUser,
    isPaid: doc.isPaid,
    price: doc.price,
    investorIsFree: doc.investorIsFree,
    investorPrice: doc.investorPrice,
    guestPaymentEnabled: doc.guestPaymentEnabled,
    guestPrice: doc.guestPrice,
    freeGuestCount: doc.freeGuestCount,
    isRefundable: doc.isRefundable,
    allowGuests: doc.allowGuests,
    locationType: doc.locationType,
    location: doc.location,
    isRegistrationClosed: doc.isRegistrationClosed,
    registrationStart: doc.registrationStart,
    registrationDeadline: doc.registrationDeadline,
    ticketDesign: doc.ticketDesign,
    createdAt: doc.createdAt,
  };
}
