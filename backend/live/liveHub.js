import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { normalizePhone } from "../utils/phone.js";

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

function verifySocketToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.ACCESS_SECRET);
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

    socket.on("join:pass", ({ eventId, phone } = {}) => {
      if (!eventId || !phone) return;
      socket.join(passRoomId(eventId, phone));
    });

    socket.on("leave:pass", ({ eventId, phone } = {}) => {
      if (!eventId || !phone) return;
      socket.leave(passRoomId(eventId, phone));
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
