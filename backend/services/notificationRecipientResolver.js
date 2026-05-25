import adminSchema from "../models/adminModel.js";
import { normalizePhone } from "../utils/phone.js";

const STAFF_ROLES = new Set(["admin", "scanner", "finance"]);

export async function resolveStaffRecipients({
  roles = [],
  adminIds = [],
  personalAdminId = null,
  excludeAdminIds = [],
}) {
  const exclude = new Set(excludeAdminIds.map(String));
  const recipients = [];

  if (personalAdminId) {
    recipients.push({
      recipientType: "admin",
      recipientId: String(personalAdminId),
      role: "",
    });
    return recipients;
  }

  const roleSet = new Set(
    (roles.length ? roles : ["admin"]).filter((r) => STAFF_ROLES.has(r))
  );

  if (adminIds.length) {
    for (const id of adminIds) {
      if (exclude.has(String(id))) continue;
      recipients.push({ recipientType: "admin", recipientId: String(id), role: "" });
    }
    return recipients;
  }

  const admins = await adminSchema
    .find({ role: { $in: [...roleSet] } })
    .select("_id role email")
    .lean();

  for (const admin of admins) {
    const id = String(admin._id);
    if (exclude.has(id)) continue;
    recipients.push({
      recipientType: "admin",
      recipientId: id,
      role: admin.role || "",
    });
  }

  return recipients;
}

export function resolvePassUserRecipient({ eventId, phone }) {
  if (!phone) return null;
  const normalized = normalizePhone(phone);
  const phoneKey = normalized.valid
    ? normalized.string
    : String(phone).replace(/\D/g, "");
  if (!phoneKey) return null;

  return {
    recipientType: "pass_user",
    recipientId: phoneKey,
    role: "user",
    passContext: { eventId: String(eventId || ""), phone: phoneKey },
  };
}

export function buildIdempotencyKey(eventKey, entityId, recipientId) {
  return `${eventKey}:${entityId || "none"}:${recipientId}`;
}
