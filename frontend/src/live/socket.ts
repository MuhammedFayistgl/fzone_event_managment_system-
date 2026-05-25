import { io, type Socket } from "socket.io-client";
import { getApiBaseURL } from "../api/axios";
import { getAccessToken } from "../utils/authRole";

let socket: Socket | null = null;
let socketToken: string | null = null;

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
  }

  return socket;
}

export function disconnectLiveSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}

export function joinEventRoom(eventId: string) {
  getLiveSocket().emit("join:event", { eventId });
}

export function leaveEventRoom(eventId: string) {
  getLiveSocket().emit("leave:event", { eventId });
}

export function joinPassRoom(
  eventId: string,
  phone: string,
  passSessionToken: string
) {
  getLiveSocket().emit("join:pass", { eventId, phone, passSessionToken });
}

export function leavePassRoom(eventId: string, phone: string) {
  getLiveSocket().emit("leave:pass", { eventId, phone });
}
