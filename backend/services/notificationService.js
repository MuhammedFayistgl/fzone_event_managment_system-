import Notification from "../models/notificationModel.js";
import UserNotification from "../models/userNotificationModel.js";
import NotificationPreference from "../models/notificationPreferenceModel.js";
import {
  resolveTemplate,
  sanitizeText,
} from "./notificationTemplates.js";
import {
  buildIdempotencyKey,
  resolvePassUserRecipient,
  resolveStaffRecipients,
} from "./notificationRecipientResolver.js";
import { emitNotificationToRecipients } from "../live/liveHub.js";

const IDEMPOTENCY_WINDOW_MS = 60 * 1000;

function buildPinned(priority) {
  return priority === "critical" || priority === "urgent";
}

export function formatNotificationRow(userNotif, notification) {
  const n = notification?.toObject ? notification.toObject() : notification;
  const un = userNotif?.toObject ? userNotif.toObject() : userNotif;

  const route = n?.route || {};
  const query = route.query || {};
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const href = qs.toString()
    ? `${route.path || "/"}?${qs}${route.hash || ""}`
    : `${route.path || "/"}${route.hash || ""}`;

  return {
    _id: String(un._id),
    notificationId: String(n._id),
    eventKey: n.eventKey,
    type: n.type,
    category: n.category,
    priority: n.priority,
    title: n.title,
    message: n.message,
    description: n.description || "",
    entity: n.entity || {},
    route: { ...route, href },
    actions: n.actions || [],
    metadata: n.metadata || {},
    read: Boolean(un.readAt),
    archived: Boolean(un.archivedAt),
    pinned: Boolean(un.pinned),
    readAt: un.readAt,
    createdAt: un.createdAt,
    deliveredAt: un.deliveredAt,
  };
}

async function isDuplicate(idempotencyKey) {
  if (!idempotencyKey) return false;
  const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
  const existing = await Notification.findOne({
    idempotencyKey,
    createdAt: { $gte: since },
  })
    .select("_id")
    .lean();
  return Boolean(existing);
}

async function getPreference(recipientType, recipientId) {
  return NotificationPreference.findOne({ recipientType, recipientId }).lean();
}

function isMuted(pref, category) {
  if (!pref) return false;
  if (pref.doNotDisturb) return true;
  return (pref.mutedCategories || []).includes(category);
}

/**
 * Central notification engine.
 */
export async function createNotification(eventKey, context = {}) {
  const tpl = resolveTemplate(eventKey, context);
  const entityId =
    context.entity?.id ||
    context.paymentId ||
    context.registrationId ||
    context.eventId ||
    "";

  const sender = context.sender || {
    actorType: "system",
    actorId: "",
    actorEmail: "",
  };

  const recipients = [];

  if (tpl.passUser && context.alsoNotifyPassUser) {
    const passRecipient = resolvePassUserRecipient(context.alsoNotifyPassUser);
    if (passRecipient) recipients.push(passRecipient);
  } else if (context.alsoNotifyPassUser) {
    const passRecipient = resolvePassUserRecipient(context.alsoNotifyPassUser);
    if (passRecipient) recipients.push(passRecipient);
  }

  if (tpl.personalAdmin && context.adminId) {
    recipients.push(
      ...(await resolveStaffRecipients({ personalAdminId: context.adminId }))
    );
  } else if (tpl.roles?.length) {
    recipients.push(
      ...(await resolveStaffRecipients({
        roles: context.audience?.roles || tpl.roles,
        adminIds: context.audience?.adminIds || [],
      }))
    );
  }

  if (!recipients.length) {
    return { created: 0, skipped: true, reason: "no_recipients" };
  }

  const baseIdempotency = `${eventKey}:${entityId}`;
  const notificationPayload = {
    eventKey,
    type: tpl.type,
    category: tpl.category,
    priority: context.priority || tpl.priority,
    title: sanitizeText(context.title || tpl.title),
    message: sanitizeText(context.message || tpl.message),
    description: sanitizeText(context.description || ""),
    sender: {
      actorType: sender.actorType || "system",
      actorId: String(sender.actorId || sender.id || ""),
      actorEmail: sender.actorEmail || sender.email || "",
    },
    audience: {
      mode: context.audience?.mode || "role",
      roles: tpl.roles || [],
      adminIds: context.audience?.adminIds || [],
    },
    entity: {
      type: context.entity?.type || "",
      id: String(entityId),
      eventId: String(context.entity?.eventId || context.eventId || ""),
      phone: String(context.entity?.phone || context.phone || ""),
    },
    route: tpl.route,
    actions: tpl.actions,
    metadata: context.metadata || {},
    templateKey: eventKey,
    idempotencyKey: baseIdempotency,
    expiresAt: context.expiresAt || null,
  };

  if (await isDuplicate(baseIdempotency)) {
    return { created: 0, skipped: true, reason: "duplicate" };
  }

  const notification = await Notification.create(notificationPayload);

  const createdRows = [];
  const emitPayloads = [];

  for (const recipient of recipients) {
    const idempotencyKey = buildIdempotencyKey(
      eventKey,
      entityId,
      recipient.recipientId
    );

    const pref = await getPreference(
      recipient.recipientType,
      recipient.recipientId
    );
    if (isMuted(pref, notificationPayload.category)) continue;

    try {
      const userNotif = await UserNotification.create({
        notificationId: notification._id,
        recipientType: recipient.recipientType,
        recipientId: recipient.recipientId,
        role: recipient.role || "",
        pinned: buildPinned(notificationPayload.priority),
        idempotencyKey,
      });

      const formatted = formatNotificationRow(userNotif, notification);
      createdRows.push(formatted);
      emitPayloads.push({
        recipientType: recipient.recipientType,
        recipientId: recipient.recipientId,
        payload: formatted,
      });
    } catch (err) {
      if (err?.code !== 11000) {
        console.error("NOTIFICATION_CREATE_ERROR:", err.message);
      }
    }
  }

  if (emitPayloads.length) {
    await emitNotificationBatch(emitPayloads);
  }

  return {
    created: createdRows.length,
    notificationId: String(notification._id),
    rows: createdRows,
  };
}

async function emitNotificationBatch(payloads) {
  for (const item of payloads) {
    const unreadCount = await getUnreadCount(
      item.recipientType,
      item.recipientId
    );
    emitNotificationToRecipients({
      recipientType: item.recipientType,
      recipientId: item.recipientId,
      notification: item.payload,
      unreadCount,
    });
  }
}

export async function getUnreadCount(recipientType, recipientId) {
  return UserNotification.countDocuments({
    recipientType,
    recipientId,
    readAt: null,
    deletedAt: null,
    archivedAt: null,
  });
}

function baseRecipientQuery(recipientType, recipientId) {
  return {
    recipientType,
    recipientId,
    deletedAt: null,
  };
}

export async function listNotifications(
  recipientType,
  recipientId,
  {
    page = 1,
    limit = 20,
    category,
    priority,
    read,
    search,
    since,
    includeArchived = false,
  } = {}
) {
  const query = baseRecipientQuery(recipientType, recipientId);
  if (!includeArchived) query.archivedAt = null;
  if (read === "true") query.readAt = { $ne: null };
  if (read === "false") query.readAt = null;
  if (since) query.createdAt = { $gte: new Date(since) };

  const skip = (Math.max(page, 1) - 1) * Math.min(limit, 50);

  const userRows = await UserNotification.find(query)
    .sort({ pinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 50))
    .lean();

  const notificationIds = userRows.map((r) => r.notificationId);
  const notifications = await Notification.find({ _id: { $in: notificationIds } }).lean();
  const byId = new Map(notifications.map((n) => [String(n._id), n]));

  let rows = userRows
    .map((un) => formatNotificationRow(un, byId.get(String(un.notificationId))))
    .filter(Boolean);

  if (category && category !== "all") {
    rows = rows.filter((r) => r.category === category);
  }
  if (priority && priority !== "all") {
    rows = rows.filter((r) => r.priority === priority);
  }
  if (search && String(search).trim()) {
    const term = String(search).trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.message.toLowerCase().includes(term)
    );
  }

  const total = await UserNotification.countDocuments(query);

  return {
    rows,
    pagination: {
      page: Math.max(page, 1),
      limit: Math.min(limit, 50),
      total,
      totalPages: Math.ceil(total / Math.min(limit, 50)) || 1,
    },
  };
}

export async function getNotificationDetail(
  recipientType,
  recipientId,
  userNotificationId
) {
  const userNotif = await UserNotification.findOne({
    _id: userNotificationId,
    ...baseRecipientQuery(recipientType, recipientId),
  }).lean();

  if (!userNotif) return null;

  const notification = await Notification.findById(userNotif.notificationId).lean();
  if (!notification) return null;

  if (!userNotif.seenAt) {
    await UserNotification.updateOne(
      { _id: userNotif._id },
      { $set: { seenAt: new Date() } }
    );
  }

  return formatNotificationRow(userNotif, notification);
}

export async function markNotificationRead(
  recipientType,
  recipientId,
  userNotificationId
) {
  const updated = await UserNotification.findOneAndUpdate(
    {
      _id: userNotificationId,
      ...baseRecipientQuery(recipientType, recipientId),
      readAt: null,
    },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  return updated;
}

export async function markAllNotificationsRead(recipientType, recipientId) {
  const result = await UserNotification.updateMany(
    {
      ...baseRecipientQuery(recipientType, recipientId),
      readAt: null,
      archivedAt: null,
    },
    { $set: { readAt: new Date() } }
  );
  return result.modifiedCount;
}

export async function archiveNotification(
  recipientType,
  recipientId,
  userNotificationId
) {
  return UserNotification.findOneAndUpdate(
    {
      _id: userNotificationId,
      ...baseRecipientQuery(recipientType, recipientId),
    },
    { $set: { archivedAt: new Date(), readAt: new Date() } },
    { new: true }
  ).lean();
}

export async function deleteNotification(
  recipientType,
  recipientId,
  userNotificationId
) {
  return UserNotification.findOneAndUpdate(
    {
      _id: userNotificationId,
      ...baseRecipientQuery(recipientType, recipientId),
    },
    { $set: { deletedAt: new Date() } },
    { new: true }
  ).lean();
}

export async function executeNotificationAction(
  recipientType,
  recipientId,
  userNotificationId,
  actionId
) {
  const userNotif = await UserNotification.findOne({
    _id: userNotificationId,
    ...baseRecipientQuery(recipientType, recipientId),
  }).lean();

  if (!userNotif) return { success: false, message: "Notification not found" };

  const notification = await Notification.findById(userNotif.notificationId).lean();
  if (!notification) return { success: false, message: "Notification not found" };

  const action = (notification.actions || []).find((a) => a.id === actionId);
  if (!action) return { success: false, message: "Action not found" };

  if (action.kind === "link") {
    await UserNotification.updateOne(
      { _id: userNotif._id },
      { $set: { actionTaken: actionId, readAt: userNotif.readAt || new Date() } }
    );
    return { success: true, kind: "link", url: action.url };
  }

  if (action.kind === "api" && actionId === "mark_resolved") {
    await UserNotification.updateOne(
      { _id: userNotif._id },
      { $set: { actionTaken: actionId, readAt: new Date() } }
    );
    return { success: true, kind: "api", message: "Marked resolved" };
  }

  if (action.kind === "api" && actionId === "retry_webhook") {
    await UserNotification.updateOne(
      { _id: userNotif._id },
      { $set: { actionTaken: actionId, readAt: userNotif.readAt || new Date() } }
    );
    return {
      success: true,
      kind: "api",
      message: "Webhook retry queued — check deliveries for status.",
    };
  }

  return { success: false, message: "Unsupported action" };
}

export async function getRecentAlerts(recipientType, recipientId, limit = 5) {
  const { rows } = await listNotifications(recipientType, recipientId, {
    page: 1,
    limit,
    read: "false",
  });
  return rows.filter((r) =>
    ["critical", "urgent", "high"].includes(r.priority)
  );
}
