import { io, type Socket } from "socket.io-client";
import { getApiBaseURL } from "../api/axios";
import { getAccessToken } from "../utils/authRole";

let socket: Socket | null = null;
let socketToken: string | null = null;
const joinedEventRooms = new Set<string>();

type PassRoomEntry = {
  eventId: string;
  phone: string;
  passSessionToken: string;
};

const joinedPassRooms = new Map<string, PassRoomEntry>();

function passRoomKey(eventId: string, phone: string) {
  const phoneKey = String(phone).replace(/\D/g, "");
  return `${String(eventId)}:${phoneKey}`;
}

function rejoinTrackedEventRooms() {
  if (!socket?.connected) return;
  for (const eventId of joinedEventRooms) {
    socket.emit("join:event", { eventId });
  }
}

function rejoinTrackedPassRooms() {
  if (!socket?.connected) return;
  for (const entry of joinedPassRooms.values()) {
    socket.emit("join:pass", entry);
  }
}

function attachSocketLifecycleHandlers(client: Socket) {
  client.on("connect", () => {
    rejoinTrackedEventRooms();
    rejoinTrackedPassRooms();
  });
}

function buildSocketAuth() {
  return {
    token: getAccessToken() || "",
  };
}

export function reconnectLiveSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
  return getLiveSocket();
}

export function getLiveSocket(): Socket {
  const nextToken = getAccessToken() || "";

  if (socket && socketToken !== nextToken) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    const baseURL = getApiBaseURL();
    socketToken = nextToken;

    socket = io(baseURL || undefined, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      auth: buildSocketAuth(),
    });

    attachSocketLifecycleHandlers(socket);
  }

  return socket;
}

export function disconnectLiveSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
  joinedEventRooms.clear();
  joinedPassRooms.clear();
}

export function joinEventRoom(eventId: string) {
  const normalizedId = String(eventId);
  joinedEventRooms.add(normalizedId);
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("join:event", { eventId: normalizedId });
  }
}

export function leaveEventRoom(eventId: string) {
  const normalizedId = String(eventId);
  joinedEventRooms.delete(normalizedId);
  getLiveSocket().emit("leave:event", { eventId: normalizedId });
}

export function joinPassRoom(
  eventId: string,
  phone: string,
  passSessionToken: string
) {
  const normalizedId = String(eventId);
  const entry: PassRoomEntry = {
    eventId: normalizedId,
    phone,
    passSessionToken,
  };
  joinedPassRooms.set(passRoomKey(normalizedId, phone), entry);
  const s = getLiveSocket();
  if (s.connected) {
    s.emit("join:pass", entry);
  }
}

export function leavePassRoom(eventId: string, phone: string) {
  joinedPassRooms.delete(passRoomKey(eventId, phone));
  getLiveSocket().emit("leave:pass", { eventId: String(eventId), phone });
}
