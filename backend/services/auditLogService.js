import mongoose from "mongoose";
import AuditLog from "../models/auditLogModel.js";

const ACTION_LABELS = {
  "payment.refund": "Payment refund",
  "registration.block": "Registration blocked",
  "registration.unblock": "Registration unblocked",
  "registrations.export": "Registrations exported",
  "payments.export": "Payments exported",
  "reconciliation.export": "Reconciliation exported",
  "reconciliation.resolve": "Reconciliation reviewed",
  "settings.updated": "Settings updated",
  "auth.login": "Admin login",
  "auth.login_failed": "Failed login attempt",
  "auth.logout": "Admin logout",
  "event.created": "Event created",
  "event.updated": "Event updated",
  "event.deleted": "Event deleted",
  "registration.check_in": "Check-in completed",
  "webhook.delivery_failed": "Webhook delivery failed",
};

export function getDateRangeBounds(dateRange) {
  const now = new Date();
  const end = now.toISOString();
  if (!dateRange || dateRange === "all") return {};
  if (dateRange === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString(), dateTo: end };
  }
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 0;
  if (!days) return {};
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { dateFrom: start.toISOString(), dateTo: end };
}

export function parseAuditFilters(input = {}) {
  const dateBounds = getDateRangeBounds(input.dateRange);
  return {
    category: input.category,
    action: input.action,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    eventId: input.eventId,
    phone: input.phone,
    targetType: input.targetType,
    search: input.search,
    dateFrom: input.dateFrom || dateBounds.dateFrom,
    dateTo: input.dateTo || dateBounds.dateTo,
    range: input.range,
  };
}

export function buildAuditQuery(filters = {}) {
  const {
    category,
    action,
    actorEmail,
    actorRole,
    eventId,
    phone,
    targetType,
    search,
    dateFrom,
    dateTo,
  } = filters;

  const query = {};

  if (category && category !== "all") {
    query.category = category;
  }

  if (action && action !== "all") {
    query.action = action;
  }

  if (actorEmail && String(actorEmail).trim()) {
    query.actorEmail = { $regex: String(actorEmail).trim(), $options: "i" };
  }

  if (actorRole && actorRole !== "all") {
    query.actorRole = actorRole;
  }

  if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
    query.eventId = new mongoose.Types.ObjectId(eventId);
  }

  if (phone && String(phone).trim()) {
    query.phone = { $regex: String(phone).trim(), $options: "i" };
  }

  if (targetType && targetType !== "all") {
    query.targetType = targetType;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search && String(search).trim()) {
    const term = String(search).trim();
    query.$or = [
      { action: { $regex: term, $options: "i" } },
      { actorEmail: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
      { targetId: { $regex: term, $options: "i" } },
      { targetType: { $regex: term, $options: "i" } },
    ];
  }

  return query;
}

export function getActionLabel(action) {
  if (!action) return "Unknown action";
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (action.startsWith("notification:")) {
    return `Notification: ${action.replace("notification:", "")}`;
  }
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}

export function getSeverity(entry) {
  const action = entry?.action || "";
  const category = entry?.category || "";
  if (category === "block" || action.includes("block")) return "critical";
  if (category === "auth" && action.includes("failed")) return "critical";
  if (category === "refund" || action.includes("refund")) return "warning";
  if (category === "webhook" && action.includes("failed")) return "warning";
  return "info";
}

export function formatAuditRow(row) {
  const event = row.eventId;
  const eventId =
    event && typeof event === "object" && event._id
      ? String(event._id)
      : event
        ? String(event)
        : null;
  const eventTitle =
    event && typeof event === "object" && event.title ? event.title : null;

  return {
    _id: String(row._id),
    action: row.action,
    actionLabel: getActionLabel(row.action),
    category: row.category,
    actorId: row.actorId ? String(row.actorId) : null,
    actorEmail: row.actorEmail || "",
    actorRole: row.actorRole || "",
    targetType: row.targetType || "",
    targetId: row.targetId || "",
    eventId,
    eventTitle,
    phone: row.phone || "",
    ip: row.ip || "",
    metadata: row.metadata || {},
    createdAt: row.createdAt,
    severity: getSeverity(row),
  };
}

function metric(value, previous = 0) {
  const curr = Number(value) || 0;
  const prev = Number(previous) || 0;
  const changePct =
    prev === 0 ? (curr > 0 ? 100 : 0) : Number((((curr - prev) / prev) * 100).toFixed(1));
  return {
    value: curr,
    changePct,
    trend: curr >= prev ? "up" : "down",
  };
}

function getPeriodBounds(filters = {}) {
  const now = new Date();
  let start = null;
  if (filters.dateFrom) {
    start = new Date(filters.dateFrom);
  } else if (filters.dateRange && filters.dateRange !== "all") {
    const bounds = getDateRangeBounds(filters.dateRange);
    start = bounds.dateFrom ? new Date(bounds.dateFrom) : null;
  }
  if (!start) {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
  }
  const durationMs = now.getTime() - start.getTime();
  const prevEnd = new Date(start);
  const prevStart = new Date(start.getTime() - durationMs);
  return { currentStart: start, currentEnd: now, prevStart, prevEnd: prevEnd };
}

async function countInRange(queryBase, start, end, extra = {}) {
  const q = {
    ...queryBase,
    ...extra,
    createdAt: { $gte: start, $lte: end },
  };
  return AuditLog.countDocuments(q);
}

async function countUniqueActors(queryBase, start, end) {
  const rows = await AuditLog.distinct("actorEmail", {
    ...queryBase,
    createdAt: { $gte: start, $lte: end },
    actorEmail: { $ne: "" },
  });
  return rows.length;
}

export async function buildSummary(filters = {}) {
  const parsed = parseAuditFilters(filters);
  const baseQuery = buildAuditQuery(parsed);
  const { currentStart, currentEnd, prevStart, prevEnd } = getPeriodBounds(parsed);
  const last24Start = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const prev24Start = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    totalCurrent,
    totalPrev,
    refundsCurrent,
    refundsPrev,
    blocksCurrent,
    blocksPrev,
    exportsCurrent,
    exportsPrev,
    paymentsCurrent,
    paymentsPrev,
    settingsCurrent,
    settingsPrev,
    last24h,
    last24hPrev,
    actorsCurrent,
    actorsPrev,
  ] = await Promise.all([
    countInRange(baseQuery, currentStart, currentEnd),
    countInRange(baseQuery, prevStart, prevEnd),
    countInRange(baseQuery, currentStart, currentEnd, { category: "refund" }),
    countInRange(baseQuery, prevStart, prevEnd, { category: "refund" }),
    countInRange(baseQuery, currentStart, currentEnd, { category: "block" }),
    countInRange(baseQuery, prevStart, prevEnd, { category: "block" }),
    countInRange(baseQuery, currentStart, currentEnd, { category: "export" }),
    countInRange(baseQuery, prevStart, prevEnd, { category: "export" }),
    countInRange(baseQuery, currentStart, currentEnd, { category: "payment" }),
    countInRange(baseQuery, prevStart, prevEnd, { category: "payment" }),
    countInRange(baseQuery, currentStart, currentEnd, { category: "settings" }),
    countInRange(baseQuery, prevStart, prevEnd, { category: "settings" }),
    countInRange(baseQuery, last24Start, currentEnd),
    countInRange(baseQuery, prev24Start, last24Start),
    countUniqueActors(baseQuery, currentStart, currentEnd),
    countUniqueActors(baseQuery, prevStart, prevEnd),
  ]);

  return {
    totalActions: metric(totalCurrent, totalPrev),
    refunds: metric(refundsCurrent, refundsPrev),
    blocks: metric(blocksCurrent, blocksPrev),
    exports: metric(exportsCurrent, exportsPrev),
    payments: metric(paymentsCurrent, paymentsPrev),
    settings: metric(settingsCurrent, settingsPrev),
    last24h: metric(last24h, last24hPrev),
    uniqueActors: metric(actorsCurrent, actorsPrev),
  };
}

export async function listAuditLogs(filters = {}, options = {}) {
  const parsed = parseAuditFilters(filters);
  const query = buildAuditQuery(parsed);
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 25, 1), 100);
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [rows, total] = await Promise.all([
    AuditLog.find(query)
      .populate({ path: "eventId", select: "title" })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    rows: rows.map(formatAuditRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAuditLogDetail(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await AuditLog.findById(id)
    .populate({ path: "eventId", select: "title" })
    .lean();
  if (!row) return null;
  return formatAuditRow(row);
}

export async function buildAnalytics(filters = {}) {
  const parsed = parseAuditFilters(filters);
  const match = buildAuditQuery(parsed);

  if (!match.createdAt) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    match.createdAt = { $gte: since };
  }

  const [dailyAgg, categoryAgg, actionAgg, actorAgg] = await Promise.all([
    AuditLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AuditLog.aggregate([
      { $match: match },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.aggregate([
      { $match: match },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AuditLog.aggregate([
      { $match: { ...match, actorEmail: { $ne: "" } } },
      { $group: { _id: "$actorEmail", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    dailyTrend: dailyAgg.map((d) => ({ date: d._id, count: d.count })),
    byCategory: categoryAgg.map((c) => ({ category: c._id || "unknown", count: c.count })),
    topActions: actionAgg.map((a) => ({
      action: a._id,
      label: getActionLabel(a._id),
      count: a.count,
    })),
    topActors: actorAgg.map((a) => ({ actor: a._id, count: a.count })),
  };
}

export async function exportAuditLogs(filters = {}) {
  const parsed = parseAuditFilters(filters);
  const query = buildAuditQuery(parsed);
  const rows = await AuditLog.find(query)
    .populate({ path: "eventId", select: "title" })
    .sort({ createdAt: -1 })
    .limit(10000)
    .lean();
  return rows.map(formatAuditRow);
}

export function buildCsvRows(rows = []) {
  return rows.map((row) => ({
    time: row.createdAt,
    action: row.action,
    actionLabel: row.actionLabel,
    category: row.category,
    severity: row.severity,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole,
    eventTitle: row.eventTitle || "",
    targetType: row.targetType,
    targetId: row.targetId,
    phone: row.phone,
    ip: row.ip,
    metadata: JSON.stringify(row.metadata || {}),
  }));
}
