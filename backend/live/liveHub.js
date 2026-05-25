import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { normalizePhone } from "../utils/phone.js";
import { verifyPassSessionToken } from "../utils/passSession.js";

/** @type {import("socket.io").Server | null} */
let io = null;

const STAFF_ROLES = new Set(["admin", "scanner", "finance"]);

export function eventRoomId(eventId) {
  return `event:${String(eventId)}`;
}

export function passRoomId(eventId, phone) {
  const normalized = normalizePhone(phone);
  const phoneKey = normalized.valid ? normalized.string : String(phone).replace(/\D/g, "");
  return `pass:${String(eventId)}:${phoneKey}`;
}

export function staffRoomId(adminId) {
  return `staff:${String(adminId)}`;
}

export function roleRoomId(role) {
  return `role:${String(role)}`;
}

export function passUserRoomId(phone) {
  const normalized = normalizePhone(phone);
  const phoneKey = normalized.valid ? normalized.string : String(phone).replace(/\D/g, "");
  return `passuser:${phoneKey}`;
}

function verifySocketToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    if (decoded.type === "pass_session") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * @param {import("http").Server} httpServer
 * @param {{ corsAllowList: string[], isAllowedDevOrigin: (origin: string) => boolean }} options
 */
export function initLiveHub(httpServer, { corsAllowList, isAllowedDevOrigin }) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (corsAllowList.includes(origin) || isAllowedDevOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS not allowed: ${origin}`));
      },
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    socket.data.user = verifySocketToken(token);
    next();
  });

  io.on("connection", (socket) => {
    socket.on("join:event", ({ eventId } = {}) => {
      if (!eventId) return;
      const role = socket.data.user?.role || "";
      if (!STAFF_ROLES.has(role)) return;
      socket.join(eventRoomId(eventId));
    });

    socket.on("leave:event", ({ eventId } = {}) => {
      if (!eventId) return;
      socket.leave(eventRoomId(eventId));
    });

    socket.on("join:pass", ({ eventId, phone, passSessionToken } = {}) => {
      if (!eventId || !phone) return;
      if (!verifyPassSessionToken(passSessionToken, eventId, phone)) return;
      socket.join(passRoomId(eventId, phone));
    });

    socket.on("leave:pass", ({ eventId, phone } = {}) => {
      if (!eventId || !phone) return;
      socket.leave(passRoomId(eventId, phone));
    });

    socket.on("join:staff", () => {
      const user = socket.data.user;
      if (!user?.id) return;
      if (!STAFF_ROLES.has(user.role || "")) return;
      socket.join(staffRoomId(user.id));
      if (user.role) socket.join(roleRoomId(user.role));
      socket.join("org:staff");
    });

    socket.on("leave:staff", () => {
      const user = socket.data.user;
      if (!user?.id) return;
      socket.leave(staffRoomId(user.id));
      if (user.role) socket.leave(roleRoomId(user.role));
      socket.leave("org:staff");
    });

    socket.on("join:passuser", ({ phone, passSessionToken, eventId } = {}) => {
      if (!phone || !eventId) return;
      if (!verifyPassSessionToken(passSessionToken, eventId, phone)) return;
      socket.join(passUserRoomId(phone));
    });
  });

  return io;
}

function emitToRooms(rooms, event, payload) {
  if (!io) return;
  for (const room of rooms) {
    io.to(room).emit(event, payload);
  }
}

export function emitCheckInUpdated(payload) {
  const { eventId, phone } = payload;
  if (!eventId) return;
  emitToRooms(
    [eventRoomId(eventId), phone ? passRoomId(eventId, phone) : null].filter(Boolean),
    "checkin:updated",
    payload
  );
}

export function emitRegistrationCreated(payload) {
  const { eventId } = payload;
  if (!eventId) return;
  emitToRooms([eventRoomId(eventId)], "registration:created", payload);
}

export function emitRegistrationBlocked(payload) {
  const { eventId, phone } = payload;
  if (!eventId) return;
  emitToRooms(
    [eventRoomId(eventId), phone ? passRoomId(eventId, phone) : null].filter(Boolean),
    "registration:blocked",
    payload
  );
}

export function emitDashboardUpdated() {
  if (!io) return;
  io.emit("dashboard:updated", { at: new Date().toISOString() });
}

export function emitNotificationToRecipients({
  recipientType,
  recipientId,
  notification,
  unreadCount,
}) {
  if (!io) return;

  const payload = {
    notification,
    unreadCount,
    at: new Date().toISOString(),
  };

  if (recipientType === "admin") {
    emitToRooms([staffRoomId(recipientId)], "notification:new", payload);
    if (notification?.role) {
      emitToRooms([roleRoomId(notification.role)], "notification:new", payload);
    }
    return;
  }

  if (recipientType === "pass_user") {
    emitToRooms([passUserRoomId(recipientId)], "notification:new", payload);
  }
}

export function emitNotificationUpdated({
  recipientType,
  recipientId,
  notificationId,
  unreadCount,
  patch = {},
}) {
  if (!io) return;
  const payload = {
    notificationId,
    unreadCount,
    patch,
    at: new Date().toISOString(),
  };

  if (recipientType === "admin") {
    emitToRooms([staffRoomId(recipientId)], "notification:updated", payload);
    return;
  }

  if (recipientType === "pass_user") {
    emitToRooms([passUserRoomId(recipientId)], "notification:updated", payload);
  }
}
