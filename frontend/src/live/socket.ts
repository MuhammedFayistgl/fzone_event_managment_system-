import { io, type Socket } from "socket.io-client";
import { getApiBaseURL } from "../api/axios";

let socket: Socket | null = null;

export function getLiveSocket(): Socket {
  if (!socket) {
    const baseURL = getApiBaseURL();

    socket = io(baseURL || undefined, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      auth: {
        token: localStorage.getItem("accessToken") || "",
      },
    });
  }

  return socket;
}

export function disconnectLiveSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinEventRoom(eventId: string) {
  getLiveSocket().emit("join:event", { eventId });
}

export function leaveEventRoom(eventId: string) {
  getLiveSocket().emit("leave:event", { eventId });
}

export function joinPassRoom(eventId: string, phone: string) {
  getLiveSocket().emit("join:pass", { eventId, phone });
}

export function leavePassRoom(eventId: string, phone: string) {
  getLiveSocket().emit("leave:pass", { eventId, phone });
}
