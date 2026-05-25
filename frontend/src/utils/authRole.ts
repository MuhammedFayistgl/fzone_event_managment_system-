import { jwtDecode } from "jwt-decode";

const VALID_ROLES = new Set(["admin", "scanner", "finance"]);

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
