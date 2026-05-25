const STAFF_ROLES = ["admin", "scanner", "finance"];

function buildRoute(path, query = {}, highlightId = "") {
  return { path, query, hash: "", openDrawer: "", highlightId };
}

function apiAction(id, label, variant = "secondary") {
  return { id, label, kind: "api", method: "POST", variant };
}

function linkAction(id, label, path, query = {}) {
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const url = qs.toString() ? `${path}?${qs}` : path;
  return { id, label, kind: "link", method: "GET", url, variant: "primary" };
}

export const NOTIFICATION_TEMPLATES = {
  "registration.created": {
    type: "success",
    category: "registration",
    priority: "medium",
    roles: ["admin", "scanner"],
    title: (ctx) => `New registration — ${ctx.eventTitle || "Event"}`,
    message: (ctx) =>
      `${ctx.investorName || ctx.phone || "Guest"} registered for ${ctx.eventTitle || "an event"}.`,
    route: (ctx) =>
      buildRoute("/allregistrations", { search: ctx.phone || "" }, ctx.registrationId),
    actions: (ctx) => [
      linkAction("view", "View registration", "/allregistrations", {
        search: ctx.phone || ctx.registrationId,
      }),
    ],
  },
  "registration.blocked": {
    type: "warning",
    category: "registration",
    priority: "high",
    roles: ["admin"],
    title: (ctx) => `Registration blocked — ${ctx.eventTitle || "Event"}`,
    message: (ctx) =>
      `A registration was blocked${ctx.blockedReason ? `: ${ctx.blockedReason}` : "."}`,
    route: (ctx) =>
      buildRoute("/allregistrations", { search: ctx.phone || "" }),
    actions: (ctx) => [
      linkAction("view", "View registration", "/allregistrations", {
        search: ctx.phone || "",
      }),
    ],
  },
  "checkin.completed": {
    type: "attendance",
    category: "checkin",
    priority: "medium",
    roles: ["admin", "scanner"],
    title: (ctx) => `Check-in — ${ctx.holderName || "Guest"}`,
    message: (ctx) =>
      `${ctx.holderName || "Guest"} checked in at ${ctx.gateName || "gate"} for ${ctx.eventTitle || "event"}.`,
    route: () => buildRoute("/attendance-logs"),
    actions: () => [linkAction("view", "Open attendance", "/attendance-logs")],
  },
  "payment.completed": {
    type: "payment",
    category: "payment",
    priority: "high",
    roles: ["admin", "finance"],
    title: (ctx) => `Payment received — ${ctx.eventTitle || "Event"}`,
    message: (ctx) =>
      `INR ${ctx.amount ?? "—"} payment confirmed${ctx.phone ? ` (${ctx.phone})` : ""}.`,
    route: (ctx) =>
      buildRoute("/payments", {
        search: ctx.razorpayPaymentId || ctx.paymentId || "",
      }),
    actions: (ctx) => [
      linkAction("view", "View payment", "/payments", {
        search: ctx.razorpayPaymentId || ctx.paymentId || "",
      }),
    ],
  },
  "payment.failed": {
    type: "error",
    category: "payment",
    priority: "urgent",
    roles: ["admin", "finance"],
    title: (ctx) => `Payment failed — ${ctx.eventTitle || "Event"}`,
    message: (ctx) =>
      `Payment failed for ${ctx.phone || "customer"}${ctx.reason ? `: ${ctx.reason}` : "."}`,
    route: (ctx) =>
      buildRoute("/payments", { search: ctx.orderId || ctx.paymentId || "" }),
    actions: (ctx) => [
      linkAction("view", "View payments", "/payments", {
        search: ctx.orderId || ctx.paymentId || "",
      }),
    ],
  },
  "refund.initiated": {
    type: "payment",
    category: "finance",
    priority: "high",
    roles: ["admin", "finance"],
    title: (ctx) => `Refund initiated — ${ctx.eventTitle || "Event"}`,
    message: (ctx) => `Refund of INR ${ctx.amount ?? "—"} initiated.`,
    route: (ctx) =>
      buildRoute("/payments", { search: ctx.paymentId || "" }),
    actions: (ctx) => [
      linkAction("view", "View payment", "/payments", { search: ctx.paymentId || "" }),
    ],
  },
  "refund.processed": {
    type: "success",
    category: "finance",
    priority: "medium",
    roles: ["admin", "finance"],
    title: (ctx) => `Refund processed — ${ctx.eventTitle || "Event"}`,
    message: (ctx) => `Refund of INR ${ctx.amount ?? "—"} has been processed.`,
    route: (ctx) =>
      buildRoute("/payments", { search: ctx.paymentId || "" }),
    actions: (ctx) => [
      linkAction("view", "View payment", "/payments", { search: ctx.paymentId || "" }),
    ],
  },
  "reconciliation.mismatch": {
    type: "reconciliation",
    category: "finance",
    priority: "critical",
    roles: ["admin", "finance"],
    title: () => "Reconciliation mismatch detected",
    message: (ctx) =>
      `${ctx.count ?? 1} transaction(s) need review${ctx.variance ? ` (variance INR ${ctx.variance})` : "."}`,
    route: () =>
      buildRoute("/finance/reconciliation", { reconciliationStatus: "mismatch" }),
    actions: () => [
      linkAction("view", "Open reconciliation", "/finance/reconciliation", {
        reconciliationStatus: "mismatch",
      }),
      apiAction("mark_resolved", "Mark resolved", "primary"),
    ],
  },
  "webhook.delivery_failed": {
    type: "error",
    category: "webhook",
    priority: "urgent",
    roles: ["admin"],
    title: (ctx) => `Webhook failed — ${ctx.eventType || "unknown"}`,
    message: (ctx) => ctx.errorMessage || "A webhook delivery failed.",
    route: () => buildRoute("/platform/webhooks", { status: "failed" }),
    actions: () => [
      linkAction("view", "View webhooks", "/platform/webhooks", { status: "failed" }),
      apiAction("retry_webhook", "Retry delivery", "primary"),
    ],
  },
  "event.created": {
    type: "event",
    category: "event",
    priority: "low",
    roles: ["admin"],
    title: (ctx) => `Event created — ${ctx.eventTitle || "New event"}`,
    message: (ctx) => `"${ctx.eventTitle || "Event"}" was created.`,
    route: (ctx) => buildRoute(`/runningevent/${ctx.eventId || ""}`),
    actions: (ctx) => [
      linkAction("view", "Open event", `/runningevent/${ctx.eventId || ""}`),
    ],
  },
  "event.updated": {
    type: "event",
    category: "event",
    priority: "medium",
    roles: ["admin", "scanner"],
    title: (ctx) => `Event updated — ${ctx.eventTitle || "Event"}`,
    message: (ctx) => `"${ctx.eventTitle || "Event"}" was updated.`,
    route: (ctx) => buildRoute(`/runningevent/${ctx.eventId || ""}`),
    actions: (ctx) => [
      linkAction("view", "Open event", `/runningevent/${ctx.eventId || ""}`),
    ],
  },
  "auth.login_failed": {
    type: "security",
    category: "security",
    priority: "critical",
    roles: ["admin"],
    title: () => "Failed login attempt",
    message: (ctx) =>
      `Failed login for ${ctx.email || "unknown user"}${ctx.reason ? ` (${ctx.reason})` : ""}.`,
    route: () => buildRoute("/platform/audit-log", { category: "auth" }),
    actions: () => [
      linkAction("view", "View audit log", "/platform/audit-log", { category: "auth" }),
    ],
  },
  "auth.login": {
    type: "info",
    category: "security",
    priority: "low",
    roles: [],
    personalAdmin: true,
    title: () => "New login to your account",
    message: (ctx) => `Successful login as ${ctx.email || "admin"}.`,
    route: () => buildRoute("/platform/audit-log"),
    actions: () => [linkAction("view", "View activity", "/platform/audit-log")],
  },
  "settings.updated": {
    type: "admin",
    category: "system",
    priority: "medium",
    roles: ["admin"],
    title: () => "Platform settings updated",
    message: () => "Organization settings were changed.",
    route: () => buildRoute("/settings"),
    actions: () => [linkAction("view", "Open settings", "/settings")],
  },
  "pass.ready": {
    type: "ticket",
    category: "registration",
    priority: "high",
    roles: [],
    passUser: true,
    title: (ctx) => `Pass ready — ${ctx.eventTitle || "Event"}`,
    message: (ctx) =>
      `Your entry pass for ${ctx.eventTitle || "the event"} is ready.`,
    route: (ctx) => buildRoute(`/portal/${ctx.eventId || ""}`),
    actions: (ctx) => [
      linkAction("view", "View pass", `/portal/${ctx.eventId || ""}`),
    ],
  },
  "waitlist.joined": {
    type: "info",
    category: "registration",
    priority: "medium",
    roles: ["admin"],
    title: (ctx) => `Waitlist join — ${ctx.eventTitle || "Event"}`,
    message: (ctx) => `${ctx.phone || "User"} joined the waitlist.`,
    route: (ctx) => buildRoute("/allregistrations", { search: ctx.phone || "" }),
    actions: (ctx) => [
      linkAction("view", "View registrations", "/allregistrations", {
        search: ctx.phone || "",
      }),
    ],
  },
};

export function resolveTemplate(eventKey, context = {}) {
  const tpl = NOTIFICATION_TEMPLATES[eventKey];
  if (!tpl) {
    return {
      type: "info",
      category: "system",
      priority: "medium",
      roles: STAFF_ROLES,
      title: context.title || "System notification",
      message: context.message || "",
      route: buildRoute(context.path || "/"),
      actions: [],
    };
  }

  return {
    type: tpl.type,
    category: tpl.category,
    priority: tpl.priority,
    roles: tpl.roles || [],
    personalAdmin: Boolean(tpl.personalAdmin),
    passUser: Boolean(tpl.passUser),
    title: typeof tpl.title === "function" ? tpl.title(context) : tpl.title,
    message: typeof tpl.message === "function" ? tpl.message(context) : tpl.message,
    route: typeof tpl.route === "function" ? tpl.route(context) : tpl.route,
    actions: typeof tpl.actions === "function" ? tpl.actions(context) : tpl.actions || [],
  };
}

export function sanitizeText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .slice(0, 2000);
}
