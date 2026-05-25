import {
  archiveNotification,
  deleteNotification,
  executeNotificationAction,
  getNotificationDetail,
  getRecentAlerts,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService.js";
import { emitNotificationUpdated } from "../live/liveHub.js";

function getStaffRecipient(req) {
  if (!req.user?.id) return null;
  return {
    recipientType: "admin",
    recipientId: String(req.user.id),
    role: req.user.role || "",
  };
}

async function emitUnreadSync(recipient) {
  const unreadCount = await getUnreadCount(
    recipient.recipientType,
    recipient.recipientId
  );
  emitNotificationUpdated({
    recipientType: recipient.recipientType,
    recipientId: recipient.recipientId,
    unreadCount,
    patch: { sync: true },
  });
  return unreadCount;
}

export const listNotificationsHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await listNotifications(
      recipient.recipientType,
      recipient.recipientId,
      {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category,
        priority: req.query.priority,
        read: req.query.read,
        search: req.query.search,
        since: req.query.since,
        includeArchived: req.query.includeArchived === "true",
      }
    );

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getUnreadCountHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await getUnreadCount(
      recipient.recipientType,
      recipient.recipientId
    );
    return res.json({ success: true, data: { count } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getNotificationDetailHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getNotificationDetail(
      recipient.recipientType,
      recipient.recipientId,
      req.params.id
    );

    if (!data) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const markReadHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updated = await markNotificationRead(
      recipient.recipientType,
      recipient.recipientId,
      req.params.id
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const unreadCount = await emitUnreadSync(recipient);
    return res.json({ success: true, data: { unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const markAllReadHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const modified = await markAllNotificationsRead(
      recipient.recipientType,
      recipient.recipientId
    );
    const unreadCount = await emitUnreadSync(recipient);
    return res.json({ success: true, data: { modified, unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const archiveNotificationHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updated = await archiveNotification(
      recipient.recipientType,
      recipient.recipientId,
      req.params.id
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const unreadCount = await emitUnreadSync(recipient);
    return res.json({ success: true, data: { unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteNotificationHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const updated = await deleteNotification(
      recipient.recipientType,
      recipient.recipientId,
      req.params.id
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const unreadCount = await emitUnreadSync(recipient);
    return res.json({ success: true, data: { unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const executeActionHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await executeNotificationAction(
      recipient.recipientType,
      recipient.recipientId,
      req.params.id,
      req.params.actionId
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const unreadCount = await emitUnreadSync(recipient);
    return res.json({ success: true, data: { ...result, unreadCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecentAlertsHandler = async (req, res) => {
  try {
    const recipient = getStaffRecipient(req);
    if (!recipient) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rows = await getRecentAlerts(
      recipient.recipientType,
      recipient.recipientId,
      Math.min(Number(req.query.limit) || 5, 10)
    );

    return res.json({ success: true, data: { rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getNotificationPreferencesHandler = async (_req, res) => {
  return res.json({
    success: true,
    data: {
      phase: 2,
      message: "Email, push, and preference controls ship in Phase 2.",
    },
  });
};
