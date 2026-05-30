import { jwtDecode } from "jwt-decode";

const VALID_ROLES = new Set(["super_admin", "admin", "scanner", "finance"]);

export const PERMISSION_KEYS = [
  "events:read",
  "events:write",
  "investors:read",
  "investors:write",
  "investors:import",
  "registrations:read",
  "registrations:write",
  "payments:read",
  "payments:refund",
  "settings:write",
  "audit:read",
  "platform:read",
  "platform:write",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

type TokenPayload = {
  exp?: number;
  role?: string;
};

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getRoleFromToken(token = getAccessToken()): string | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    if (!decoded.role || !VALID_ROLES.has(decoded.role)) return null;
    return decoded.role;
  } catch {
    return null;
  }
}

export function isSuperAdmin(token = getAccessToken()): boolean {
  return getRoleFromToken(token) === "super_admin";
}

export function isAccessTokenValid(): boolean {
  return Boolean(getRoleFromToken());
}

export function clearAccessToken() {
  localStorage.removeItem("accessToken");
}

const PASS_SESSION_PREFIX = "passSession:";

export function storePassSessionToken(eventId: string, phone: string, token: string) {
  sessionStorage.setItem(`${PASS_SESSION_PREFIX}${eventId}:${phone}`, token);
}

export function getPassSessionToken(eventId: string, phone: string): string {
  return sessionStorage.getItem(`${PASS_SESSION_PREFIX}${eventId}:${phone}`) || "";
}

export function clearPassSessionToken(eventId: string, phone: string) {
  sessionStorage.removeItem(`${PASS_SESSION_PREFIX}${eventId}:${phone}`);
}

export function hasPermission(
  permissions: string[],
  key: PermissionKey,
  role: string | null = getRoleFromToken()
): boolean {
  if (role === "super_admin") return true;
  if (role === "scanner") {
    return ["registrations:read", "events:read"].includes(key);
  }
  if (role === "finance") {
    return ["payments:read", "payments:refund", "registrations:read"].includes(key);
  }
  if (role === "admin") {
    return permissions.includes(key);
  }
  return false;
}
