import { isAxiosError } from "axios";

function messageFromBody(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return null;
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong"
): string {
  if (typeof err === "string" && err.trim()) return err.trim();

  if (isAxiosError(err)) {
    if (!err.response) {
      if (err.code === "ECONNABORTED") {
        return "Request timed out. Please try again.";
      }
      return "Cannot reach server. Check your connection and try again.";
    }

    const fromBody = messageFromBody(err.response.data);
    if (fromBody) return fromBody;

    switch (err.response.status) {
      case 401:
        return "Invalid email or password";
      case 403:
        return "Access denied";
      case 400:
        return "Invalid request";
      case 500:
        return "Server error — please try again";
      default:
        return fallback;
    }
  }

  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim() && msg !== "Rejected") {
      return msg.trim();
    }
  }

  return fallback;
}
