/**
 * Canonical phone handling — single source of truth for Phase 1+.
 * Storage: registrations/payments use string; investors may use Number in legacy DB.
 */

export function normalizePhone(input) {
  if (input === undefined || input === null || input === "") {
    return { valid: false, message: "Phone is required" };
  }

  const digits = String(input).replace(/\D/g, "");

  if (digits.length !== 10) {
    return { valid: false, message: "Invalid phone number" };
  }

  return {
    valid: true,
    string: digits,
    number: Number(digits),
  };
}

/** Match investor Phone_No (Number) or legacy string storage */
export function investorPhoneQuery(normalized) {
  return {
    $or: [
      { Phone_No: normalized.number },
      { Phone_No: normalized.string },
    ],
  };
}

/** Match registration / payment phone (string-first, tolerate number) */
export function registrationPhoneQuery(normalized) {
  return {
    $or: [
      { phone: normalized.string },
      { phone: normalized.number },
    ],
  };
}
