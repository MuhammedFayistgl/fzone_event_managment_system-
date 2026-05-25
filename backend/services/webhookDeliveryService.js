import mongoose from "mongoose";
import WebhookDelivery from "../models/webhookDeliveryModel.js";

const EVENT_LABELS = {
  "payment.captured": "Payment captured",
  "refund.created": "Refund created",
  "refund.processed": "Refund processed",
  "refund.failed": "Refund failed",
  "payment.refunded": "Payment refunded",
  error: "Webhook error",
  unknown: "Unknown event",
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

export function parseWebhookFilters(input = {}) {
  const dateBounds = getDateRangeBounds(input.dateRange);
  return {
    status: input.status,
    eventType: input.eventType,
    provider: input.provider,
    httpStatus: input.httpStatus,
    search: input.search,
    dateFrom: input.dateFrom || dateBounds.dateFrom,
    dateTo: input.dateTo || dateBounds.dateTo,
    range: input.range,
  };
}

export function buildWebhookQuery(filters = {}) {
  const { status, eventType, provider, httpStatus, search, dateFrom, dateTo } = filters;
  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (eventType && eventType !== "all") {
    query.eventType = eventType;
  }

  if (provider && provider !== "all") {
    query.provider = provider;
  }

  if (httpStatus && httpStatus !== "all") {
    const code = Number(httpStatus);
    if (Number.isFinite(code)) query.httpStatus = code;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search && String(search).trim()) {
    const term = String(search).trim();
    query.$or = [
      { eventType: { $regex: term, $options: "i" } },
      { entityId: { $regex: term, $options: "i" } },
      { errorMessage: { $regex: term, $options: "i" } },
      { provider: { $regex: term, $options: "i" } },
    ];
  }

  return query;
}

export function getEventTypeLabel(eventType) {
  if (!eventType) return "Unknown event";
  if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType];
  return eventType.replace(/\./g, " · ").replace(/_/g, " ");
}

export function formatWebhookRow(row) {
  return {
    _id: String(row._id),
    provider: row.provider || "razorpay",
    eventType: row.eventType,
    eventTypeLabel: getEventTypeLabel(row.eventType),
    entityId: row.entityId || "",
    status: row.status,
    httpStatus: row.httpStatus ?? null,
    errorMessage: row.errorMessage || "",
    payloadSummary: row.payloadSummary || {},
    processedAt: row.processedAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
  return { currentStart: start, currentEnd: now, prevStart, prevEnd };
}

async function countInRange(queryBase, start, end, extra = {}) {
  return WebhookDelivery.countDocuments({
    ...queryBase,
    ...extra,
    createdAt: { $gte: start, $lte: end },
  });
}

const REFUND_EVENT_FILTER = {
  eventType: {
    $in: ["refund.created", "refund.processed", "refund.failed", "payment.refunded"],
  },
};

export async function buildSummary(filters = {}) {
  const parsed = parseWebhookFilters(filters);
  const baseQuery = buildWebhookQuery(parsed);
  const { currentStart, currentEnd, prevStart, prevEnd } = getPeriodBounds(parsed);
  const last24Start = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const prev24Start = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    totalCurrent,
    totalPrev,
    processedCurrent,
    processedPrev,
    failedCurrent,
    failedPrev,
    ignoredCurrent,
    ignoredPrev,
    receivedCurrent,
    receivedPrev,
    last24h,
    last24hPrev,
    paymentCapturedCurrent,
    paymentCapturedPrev,
    refundCurrent,
    refundPrev,
  ] = await Promise.all([
    countInRange(baseQuery, currentStart, currentEnd),
    countInRange(baseQuery, prevStart, prevEnd),
    countInRange(baseQuery, currentStart, currentEnd, { status: "processed" }),
    countInRange(baseQuery, prevStart, prevEnd, { status: "processed" }),
    countInRange(baseQuery, currentStart, currentEnd, { status: "failed" }),
    countInRange(baseQuery, prevStart, prevEnd, { status: "failed" }),
    countInRange(baseQuery, currentStart, currentEnd, { status: "ignored" }),
    countInRange(baseQuery, prevStart, prevEnd, { status: "ignored" }),
    countInRange(baseQuery, currentStart, currentEnd, { status: "received" }),
    countInRange(baseQuery, prevStart, prevEnd, { status: "received" }),
    countInRange(baseQuery, last24Start, currentEnd),
    countInRange(baseQuery, prev24Start, last24Start),
    countInRange(baseQuery, currentStart, currentEnd, { eventType: "payment.captured" }),
    countInRange(baseQuery, prevStart, prevEnd, { eventType: "payment.captured" }),
    countInRange(baseQuery, currentStart, currentEnd, REFUND_EVENT_FILTER),
    countInRange(baseQuery, prevStart, prevEnd, REFUND_EVENT_FILTER),
  ]);

  return {
    totalDeliveries: metric(totalCurrent, totalPrev),
    processed: metric(processedCurrent, processedPrev),
    failed: metric(failedCurrent, failedPrev),
    ignored: metric(ignoredCurrent, ignoredPrev),
    received: metric(receivedCurrent, receivedPrev),
    last24h: metric(last24h, last24hPrev),
    paymentCaptured: metric(paymentCapturedCurrent, paymentCapturedPrev),
    refundEvents: metric(refundCurrent, refundPrev),
  };
}

export async function listWebhookDeliveries(filters = {}, options = {}) {
  const parsed = parseWebhookFilters(filters);
  const query = buildWebhookQuery(parsed);
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 25, 1), 100);
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder === "asc" ? 1 : -1;

  const [rows, total] = await Promise.all([
    WebhookDelivery.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WebhookDelivery.countDocuments(query),
  ]);

  return {
    rows: rows.map(formatWebhookRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getWebhookDetail(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await WebhookDelivery.findById(id).lean();
  if (!row) return null;
  return formatWebhookRow(row);
}

export async function buildAnalytics(filters = {}) {
  const parsed = parseWebhookFilters(filters);
  const match = buildWebhookQuery(parsed);

  if (!match.createdAt) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    match.createdAt = { $gte: since };
  }

  const [dailyAgg, statusAgg, eventAgg, httpAgg] = await Promise.all([
    WebhookDelivery.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    WebhookDelivery.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    WebhookDelivery.aggregate([
      { $match: match },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    WebhookDelivery.aggregate([
      { $match: { ...match, httpStatus: { $ne: null } } },
      { $group: { _id: "$httpStatus", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    dailyTrend: dailyAgg.map((d) => ({ date: d._id, count: d.count })),
    byStatus: statusAgg.map((s) => ({ status: s._id || "unknown", count: s.count })),
    topEventTypes: eventAgg.map((e) => ({
      eventType: e._id,
      label: getEventTypeLabel(e._id),
      count: e.count,
    })),
    httpStatusBreakdown: httpAgg.map((h) => ({
      httpStatus: h._id,
      count: h.count,
    })),
  };
}

export async function exportWebhookDeliveries(filters = {}) {
  const parsed = parseWebhookFilters(filters);
  const query = buildWebhookQuery(parsed);
  const rows = await WebhookDelivery.find(query).sort({ createdAt: -1 }).limit(10000).lean();
  return rows.map(formatWebhookRow);
}

export function buildCsvRows(rows = []) {
  return rows.map((row) => ({
    time: row.createdAt,
    provider: row.provider,
    eventType: row.eventType,
    eventTypeLabel: row.eventTypeLabel,
    status: row.status,
    httpStatus: row.httpStatus ?? "",
    entityId: row.entityId,
    errorMessage: row.errorMessage,
    processedAt: row.processedAt || "",
    payloadSummary: JSON.stringify(row.payloadSummary || {}),
  }));
}
