import type { AppNotification } from "../features/notifications/types/notification.types";

const ALLOWED_PREFIXES = [
  "/",
  "/payments",
  "/allregistrations",
  "/finance/reconciliation",
  "/platform/",
  "/settings",
  "/attendance-logs",
  "/runningevent/",
  "/portal/",
  "/user-management",
  "/event",
];

export function resolveNotificationHref(notification: AppNotification): string {
  if (notification.route?.href) return notification.route.href;

  const path = notification.route?.path || "/";
  const query = notification.route?.query || {};
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  if (notification.route?.highlightId) {
    qs.set("highlight", notification.route.highlightId);
  }
  const href = qs.toString() ? `${path}?${qs}` : path;
  const allowed = ALLOWED_PREFIXES.some((p) => href === p || href.startsWith(p));
  return allowed ? href : "/";
}

export function playNotificationSound(priority: string) {
  if (priority !== "critical" && priority !== "urgent") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = priority === "critical" ? 880 : 660;
    gain.gain.value = 0.04;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 120);
  } catch {
    /* ignore */
  }
}
