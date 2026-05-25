export function buildPaymentDeepLink(options: {
  paymentId?: string | null;
  orderId?: string | null;
  mongoId?: string;
}) {
  const search =
    options.paymentId || options.orderId || options.mongoId || "";
  if (!search) return "/payments";
  return `/payments?search=${encodeURIComponent(search)}`;
}

export function buildRegistrationDeepLink(options: {
  targetId?: string;
  phone?: string;
}) {
  const search = options.phone || options.targetId || "";
  if (!search) return "/allregistrations";
  return `/allregistrations?search=${encodeURIComponent(search)}`;
}

export function buildEventDeepLink(eventId?: string | null) {
  if (!eventId) return "/";
  return `/runningevent/${eventId}`;
}
