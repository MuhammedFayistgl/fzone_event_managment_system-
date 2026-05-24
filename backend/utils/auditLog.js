import AuditLog from "../models/auditLogModel.js";

export async function logAuditAction({
  action,
  category = "registration",
  actor = null,
  targetType = "",
  targetId = "",
  eventId = null,
  phone = "",
  metadata = {},
  req = null,
}) {
  try {
    await AuditLog.create({
      action,
      category,
      actorId: actor?.id || actor?._id || null,
      actorEmail: actor?.email || "",
      actorRole: actor?.role || "",
      targetType,
      targetId: String(targetId || ""),
      eventId: eventId || null,
      phone: String(phone || ""),
      metadata,
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    });
  } catch (err) {
    console.error("AUDIT_LOG_ERROR:", err.message);
  }
}
