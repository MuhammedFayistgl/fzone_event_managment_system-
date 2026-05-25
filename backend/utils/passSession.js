import jwt from "jsonwebtoken";
import { normalizePhone } from "./phone.js";

const TTL = "30m";

export function issuePassSessionToken(eventId, phone) {
  const normalized = normalizePhone(phone);
  const phoneKey = normalized.valid ? normalized.string : String(phone).replace(/\D/g, "");

  return jwt.sign(
    {
      type: "pass_session",
      eventId: String(eventId),
      phone: phoneKey,
    },
    process.env.ACCESS_SECRET,
    { expiresIn: TTL }
  );
}

export function verifyPassSessionToken(token, eventId, phone) {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    if (decoded.type !== "pass_session") return false;

    const normalized = normalizePhone(phone);
    const phoneKey = normalized.valid ? normalized.string : String(phone).replace(/\D/g, "");

    return (
      String(decoded.eventId) === String(eventId) &&
      String(decoded.phone) === phoneKey
    );
  } catch {
    return false;
  }
}
