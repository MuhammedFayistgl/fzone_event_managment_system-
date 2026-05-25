import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import Investor from "../models/Investor.js";
import AuditLog from "../models/auditLogModel.js";
import WebhookDelivery from "../models/webhookDeliveryModel.js";
import {
  getActiveRefundTotal,
  getProcessedRefundTotal,
  getNetPaymentAmount,
  getLatestRefundStatus,
  mapRefundEntry,
  getRefundableRemaining,
} from "../utils/paymentRefund.js";
import razorpay, { isRazorpayConfigured } from "../utils/razorpayClient.js";
import { redisGet, redisSetEx } from "../config/redis.js";
import { buildInvestorLookupByPhone } from "../utils/resolveRegistrationInvestors.js";

const AMOUNT_TOLERANCE = 0.01;
const GATEWAY_CACHE_KEY = "reconciliation:razorpay:map";
const GATEWAY_CACHE_TTL = 300;
const ALLOWED_SORT_FIELDS = ["createdAt", "amount", "status", "method", "paidAt"];

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

export function parseReconciliationFilters(input = {}) {
  const dateBounds = getDateRangeBounds(input.dateRange);
  return {
    ...input,
    dateFrom: input.dateFrom || dateBounds.dateFrom,
    dateTo: input.dateTo || dateBounds.dateTo,
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
  const durationMs = Math.max(now.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start);
  const prevStart = new Date(start.getTime() - durationMs);
  return { currentStart: start, currentEnd: now, prevStart, prevEnd };
}

function computedStatusStages() {
  return [
    {
      $addFields: {
        _processedRefundTotal: {
          $reduce: {
            input: { $ifNull: ["$refunds", []] },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $cond: [
                    { $eq: ["$$this.status", "processed"] },
                    { $ifNull: ["$$this.amount", 0] },
                    0,
                  ],
                },
              ],
            },
          },
        },
        _hasPendingRefund: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ["$refunds", []] },
                  as: "r",
                  cond: { $eq: ["$$r.status", "pending"] },
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        _settlementStatus: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "created"] }, then: "pending" },
              { case: { $eq: ["$status", "failed"] }, then: "unknown" },
              {
                case: {
                  $and: [
                    { $in: ["$status", ["success", "refunded"]] },
                    { $ne: [{ $ifNull: ["$razorpay_payment_id", ""] }, ""] },
                  ],
                },
                then: "settled",
              },
            ],
            default: "unknown",
          },
        },
        _reconciliationStatus: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "failed"] }, then: "failed" },
              {
                case: {
                  $or: [
                    { $eq: ["$status", "refunded"] },
                    { $gt: ["$_processedRefundTotal", 0] },
                  ],
                },
                then: "refunded",
              },
              {
                case: {
                  $or: [{ $eq: ["$status", "created"] }, "$_hasPendingRefund"],
                },
                then: "pending",
              },
              {
                case: {
                  $and: [
                    { $eq: ["$status", "success"] },
                    { $eq: [{ $ifNull: ["$razorpay_payment_id", ""] }, ""] },
                  ],
                },
                then: "mismatch",
              },
              { case: { $eq: ["$status", "success"] }, then: "matched" },
            ],
            default: "pending",
          },
        },
      },
    },
  ];
}

export const RECONCILIATION_STATUSES = [
  "matched",
  "pending",
  "failed",
  "mismatch",
  "refunded",
];

export function computeReconciliationStatus(payment, gatewayEntity = null) {
  const status = payment?.status;
  const processedRefund = getProcessedRefundTotal(payment);
  const pendingRefund = (payment?.refunds || []).some((r) => r.status === "pending");

  if (status === "failed") return "failed";
  if (status === "refunded" || processedRefund > 0) {
    if (status === "success" && processedRefund < Number(payment.amount || 0)) {
      return pendingRefund ? "pending" : "matched";
    }
    return "refunded";
  }
  if (status === "created") return "pending";
  if (pendingRefund) return "pending";

  if (status === "success") {
    if (!payment.razorpay_payment_id) return "mismatch";
    if (gatewayEntity) {
      const gatewayAmount = Number(gatewayEntity.amount || 0) / 100;
      const ledgerAmount = Number(payment.amount || 0);
      if (Math.abs(gatewayAmount - ledgerAmount) > AMOUNT_TOLERANCE) {
        return "mismatch";
      }
      if (gatewayEntity.status && gatewayEntity.status !== "captured") {
        return "mismatch";
      }
    }
    return "matched";
  }

  return "pending";
}

export function computeSettlementStatus(payment, gatewayEntity = null) {
  if (payment?.status === "created") return "pending";
  if (payment?.status === "failed") return "unknown";
  if (gatewayEntity?.status === "captured") return "settled";
  if (payment?.status === "success" && payment?.razorpay_payment_id) return "settled";
  return "unknown";
}

export function buildReconciliationQuery(filters = {}) {
  const {
    eventId,
    status,
    reconciliationStatus,
    method,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    search,
  } = filters;

  const query = {};

  if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
    query.eventId = new mongoose.Types.ObjectId(eventId);
  }

  if (status && status !== "all") {
    query.status = status === "pending" ? "created" : status;
  }

  if (method && method !== "all") {
    query.method = method;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (amountMin != null && amountMin !== "") {
    query.amount = query.amount || {};
    query.amount.$gte = Number(amountMin);
  }

  if (amountMax != null && amountMax !== "") {
    query.amount = query.amount || {};
    query.amount.$lte = Number(amountMax);
  }

  return query;
}

async function applyInvestorNameSearch(query, search) {
  if (!search || !String(search).trim()) return query;
  const term = String(search).trim();

  const searchConditions = [
    { phone: { $regex: term, $options: "i" } },
    { razorpay_order_id: { $regex: term, $options: "i" } },
    { razorpay_payment_id: { $regex: term, $options: "i" } },
  ];

  const investors = await Investor.find({ Name: { $regex: term, $options: "i" } })
    .select("Phone_No")
    .limit(50)
    .lean();

  const phones = investors
    .map((i) => String(i.Phone_No || "").replace(/\D/g, ""))
    .filter(Boolean);

  if (phones.length) {
    searchConditions.push({ phone: { $in: phones } });
  }

  if (query.$or) {
    return { ...query, $and: [{ $or: query.$or }, { $or: searchConditions }] };
  }

  return { ...query, $or: searchConditions };
}

export async function fetchGatewayMap() {
  const cached = await redisGet(GATEWAY_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      /* ignore */
    }
  }

  const map = {};
  if (!isRazorpayConfigured()) return map;

  try {
    const response = await razorpay.payments.all({ count: 100 });
    for (const item of response?.items || []) {
      if (item.order_id) map[item.order_id] = item;
      if (item.id) map[item.id] = item;
    }
    await redisSetEx(GATEWAY_CACHE_KEY, GATEWAY_CACHE_TTL, JSON.stringify(map));
  } catch (err) {
    console.warn("Reconciliation gateway fetch failed:", err.message);
  }

  return map;
}

function formatLedgerBase(payment, investor = null) {
  const eventDoc = payment.eventId;
  const eventIsRefundable = Boolean(eventDoc?.isRefundable);

  return {
    _id: String(payment._id),
    eventId: eventDoc?._id ? String(eventDoc._id) : String(payment.eventId),
    event: eventDoc
      ? {
          _id: String(eventDoc._id),
          title: eventDoc.title,
          isRefundable: eventDoc.isRefundable,
        }
      : null,
    phone: payment.phone,
    investorName: investor?.Name || payment.investorName || null,
    investorCode: investor?.Code_No || null,
    amount: Number(payment.amount || 0),
    currency: payment.currency || "INR",
    status: payment.status,
    method: payment.method || "razorpay",
    guestCount: payment.guestCount ?? 0,
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id || null,
    paidAt: payment.paidAt || null,
    failedAt: payment.failedAt || null,
    createdAt: payment.createdAt,
    refunds: (payment.refunds || []).map(mapRefundEntry),
    latestRefundStatus: getLatestRefundStatus(payment),
    isRefundable: eventIsRefundable,
    refundableRemaining: getRefundableRemaining(payment),
  };
}

export function enrichPaymentRow(payment, investor, gatewayMap = {}) {
  const gatewayEntity =
    gatewayMap[payment.razorpay_order_id] ||
    gatewayMap[payment.razorpay_payment_id] ||
    null;

  const ledgerNet = getNetPaymentAmount(payment);
  const gatewayAmount = gatewayEntity
    ? Number(gatewayEntity.amount || 0) / 100
    : null;
  const variance =
    gatewayAmount != null
      ? Number((Number(payment.amount || 0) - gatewayAmount).toFixed(2))
      : 0;

  const reconciliationStatus = computeReconciliationStatus(payment, gatewayEntity);
  const settlementStatus = computeSettlementStatus(payment, gatewayEntity);

  return {
    ...formatLedgerBase(payment, investor),
    reconciliationStatus,
    settlementStatus,
    gateway: "razorpay",
    gatewayAmount,
    ledgerNet,
    variance,
    gatewayStatus: gatewayEntity?.status || null,
    reconciliationReviewedAt: payment.reconciliationReviewedAt || null,
    reconciliationNote: payment.reconciliationNote || "",
  };
}

function metric(value, previous = 0) {
  const prev = Number(previous) || 0;
  const changePct =
    prev === 0 ? (value > 0 ? 100 : 0) : Number((((value - prev) / prev) * 100).toFixed(1));
  return {
    value: Number(value) || 0,
    changePct,
    trend: value >= prev ? "up" : "down",
  };
}

export function buildSummaryFromRows(rows = [], previousRows = [], gatewaySample = null) {
  const counts = { matched: 0, pending: 0, failed: 0, mismatch: 0, refunded: 0 };
  let revenueProcessed = 0;
  let settlementAmount = 0;
  let refundTotal = 0;

  for (const row of rows) {
    counts[row.reconciliationStatus] = (counts[row.reconciliationStatus] || 0) + 1;
    revenueProcessed += Number(row.ledgerNet || 0);
    settlementAmount += Number(row.gatewayAmount ?? row.amount ?? 0);
    refundTotal += getProcessedRefundTotal(row);
  }

  const prevCounts = { matched: 0, pending: 0, failed: 0, mismatch: 0, refunded: 0 };
  let prevRevenue = 0;
  for (const row of previousRows) {
    prevCounts[row.reconciliationStatus] = (prevCounts[row.reconciliationStatus] || 0) + 1;
    prevRevenue += Number(row.ledgerNet || 0);
  }

  return {
    totalTransactions: metric(rows.length, previousRows.length),
    reconciled: metric(counts.matched, prevCounts.matched),
    pending: metric(counts.pending, prevCounts.pending),
    failed: metric(counts.failed, prevCounts.failed),
    revenueProcessed: metric(revenueProcessed, prevRevenue),
    settlementAmount: metric(
      gatewaySample != null ? gatewaySample : settlementAmount,
      prevRevenue
    ),
    disputed: metric(counts.mismatch, prevCounts.mismatch),
    refunds: metric(refundTotal, 0),
    note:
      gatewaySample != null
        ? "Settlement uses Razorpay captured sample (latest 100). Ledger totals use your payment records."
        : "",
  };
}

export async function buildAnalytics(filters = {}) {
  const parsed = parseReconciliationFilters(filters);
  const match = buildReconciliationQuery(parsed);

  if (!match.createdAt) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    match.createdAt = { $gte: since };
  }

  const dailyAgg = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: 1 },
        revenue: { $sum: "$amount" },
        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const methodAgg = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ["$method", "razorpay"] },
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
      },
    },
  ]);

  const monthlyAgg = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        settled: {
          $sum: {
            $cond: [{ $in: ["$status", ["success", "refunded"]] }, "$amount", 0],
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    dailyTrend: dailyAgg.map((d) => ({
      date: d._id,
      total: d.total,
      revenue: d.revenue,
      failed: d.failed,
      matched: d.success,
    })),
    revenueByDay: dailyAgg.map((d) => ({ date: d._id, amount: d.revenue })),
    failedByDay: dailyAgg.map((d) => ({ date: d._id, count: d.failed })),
    paymentMethods: methodAgg.map((m) => ({
      method: m._id || "unknown",
      count: m.count,
      amount: m.amount,
    })),
    monthlySettlements: monthlyAgg.map((m) => ({
      month: m._id,
      amount: m.settled,
      count: m.count,
    })),
  };
}

export function buildTimeline(payment, webhooks = [], auditEntries = []) {
  const events = [];

  events.push({
    id: "created",
    type: "payment_created",
    title: "Payment initiated",
    at: payment.createdAt,
    status: "info",
  });

  if (payment.paidAt) {
    events.push({
      id: "paid",
      type: "payment_captured",
      title: "Payment captured",
      at: payment.paidAt,
      status: "success",
      meta: { razorpay_payment_id: payment.razorpay_payment_id },
    });
  }

  if (payment.failedAt) {
    events.push({
      id: "failed",
      type: "payment_failed",
      title: "Payment failed",
      at: payment.failedAt,
      status: "error",
    });
  }

  for (const wh of webhooks) {
    events.push({
      id: String(wh._id),
      type: "webhook",
      title: `Webhook: ${wh.eventType}`,
      at: wh.createdAt,
      status: wh.status === "failed" ? "error" : "info",
      meta: wh.payloadSummary,
    });
  }

  for (const entry of auditEntries) {
    events.push({
      id: String(entry._id),
      type: "audit",
      title: entry.action,
      at: entry.createdAt,
      status: "info",
      meta: entry.metadata,
    });
  }

  for (const refund of payment.refunds || []) {
    events.push({
      id: refund.refundId || refund._id,
      type: "refund",
      title: `Refund ${refund.status || "pending"}`,
      at: refund.initiatedAt || refund.processedAt || payment.updatedAt,
      status: refund.status === "failed" ? "error" : "warning",
      meta: { amount: refund.amount, reason: refund.reason },
    });
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

async function enrichPaymentList(payments, gatewayMap) {
  const phones = payments.map((p) => p.phone);
  const investorByPhone = await buildInvestorLookupByPhone(phones);

  return payments.map((payment) => {
    const phoneKey = String(payment.phone || "").replace(/\D/g, "");
    const investor = investorByPhone.get(phoneKey) || null;
    return enrichPaymentRow(payment, investor, gatewayMap);
  });
}

export async function getEnrichedPayments(filters = {}, options = {}) {
  const parsed = parseReconciliationFilters(filters);
  const query = await applyInvestorNameSearch(
    buildReconciliationQuery(parsed),
    parsed.search
  );

  const sortField = ALLOWED_SORT_FIELDS.includes(options.sortBy)
    ? options.sortBy
    : "createdAt";
  const sortOrder = options.sortOrder === "asc" ? 1 : -1;
  const page = Math.max(Number(options.page) || 1, 1);
  const maxLimit = Number(options.limit) > 100 ? 10000 : 100;
  const limit = Math.min(Math.max(Number(options.limit) || 25, 1), maxLimit);

  const needsReconFilter =
    parsed.reconciliationStatus && parsed.reconciliationStatus !== "all";
  const needsSettlementFilter =
    parsed.settlementStatus && parsed.settlementStatus !== "all";
  const needsComputedFilter = needsReconFilter || needsSettlementFilter;

  const gatewayMap = await fetchGatewayMap();

  if (needsComputedFilter) {
    const filterStages = [];
    if (needsReconFilter) {
      filterStages.push({ $match: { _reconciliationStatus: parsed.reconciliationStatus } });
    }
    if (needsSettlementFilter) {
      filterStages.push({ $match: { _settlementStatus: parsed.settlementStatus } });
    }

    const pipeline = [
      { $match: query },
      ...computedStatusStages(),
      ...filterStages,
      { $sort: { [sortField]: sortOrder } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ];

    const [result] = await Payment.aggregate(pipeline);
    const total = result?.metadata?.[0]?.total || 0;
    const idDocs = result?.data || [];

    if (!idDocs.length) {
      return { rows: [], total, page, limit, query };
    }

    const payments = await Payment.find({ _id: { $in: idDocs.map((p) => p._id) } })
      .populate("eventId", "title isRefundable")
      .lean();

    const orderMap = new Map(idDocs.map((p, i) => [String(p._id), i]));
    payments.sort(
      (a, b) => (orderMap.get(String(a._id)) ?? 0) - (orderMap.get(String(b._id)) ?? 0)
    );

    const rows = await enrichPaymentList(payments, gatewayMap);
    return { rows, total, page, limit, query };
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("eventId", "title isRefundable")
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
  ]);

  const rows = await enrichPaymentList(payments, gatewayMap);
  return { rows, total, page, limit, query };
}

export async function getSummary(filters = {}) {
  const parsed = parseReconciliationFilters(filters);
  const query = buildReconciliationQuery(parsed);
  const { currentStart, currentEnd, prevStart, prevEnd } = getPeriodBounds(parsed);

  const [currentPayments, previousPayments, gatewayMap] = await Promise.all([
    Payment.find({ ...query, createdAt: { $gte: currentStart, $lte: currentEnd } })
      .populate("eventId", "title isRefundable")
      .lean(),
    Payment.find({
      ...query,
      createdAt: { $gte: prevStart, $lt: prevEnd },
    })
      .populate("eventId", "title isRefundable")
      .lean(),
    fetchGatewayMap(),
  ]);

  const enrichAll = (list) =>
    list.map((p) => enrichPaymentRow(p, null, gatewayMap));

  let gatewaySample = null;
  if (isRazorpayConfigured()) {
    try {
      const rp = await razorpay.payments.all({ count: 100 });
      gatewaySample = (rp?.items || [])
        .filter((i) => i.status === "captured")
        .reduce((s, i) => s + Number(i.amount || 0) / 100, 0);
    } catch {
      gatewaySample = null;
    }
  }

  return buildSummaryFromRows(
    enrichAll(currentPayments),
    enrichAll(previousPayments),
    gatewaySample
  );
}

export async function getTransactionDetail(paymentId) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;

  const payment = await Payment.findById(paymentId)
    .populate("eventId", "title isRefundable startTime endTime")
    .lean();

  if (!payment) return null;

  const gatewayMap = await fetchGatewayMap();
  const investorByPhone = await buildInvestorLookupByPhone([payment.phone]);
  const phoneKey = String(payment.phone || "").replace(/\D/g, "");
  const investor = investorByPhone.get(phoneKey) || null;
  const row = enrichPaymentRow(payment, investor, gatewayMap);

  const entityId = payment.razorpay_payment_id || payment.razorpay_order_id || "";
  const [webhooks, auditEntries] = await Promise.all([
    WebhookDelivery.find({
      $or: [{ entityId }, { "payloadSummary.payment_id": payment.razorpay_payment_id }],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    AuditLog.find({
      $or: [{ targetId: String(payment._id) }, { phone: payment.phone }],
      category: { $in: ["payment", "refund", "export"] },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return {
    transaction: row,
    timeline: buildTimeline(payment, webhooks, auditEntries),
    gatewayResponse: gatewayMap[payment.razorpay_order_id] ||
      gatewayMap[payment.razorpay_payment_id] || null,
  };
}

export async function getActivityFeed(limit = 20) {
  const [audits, webhooks] = await Promise.all([
    AuditLog.find({ category: { $in: ["payment", "refund", "export", "webhook"] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    WebhookDelivery.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  const items = [
    ...audits.map((a) => ({
      id: String(a._id),
      source: "audit",
      title: a.action,
      description: a.actorEmail || a.category,
      at: a.createdAt,
      status: "info",
    })),
    ...webhooks.map((w) => ({
      id: String(w._id),
      source: "webhook",
      title: w.eventType,
      description: w.status,
      at: w.createdAt,
      status: w.status === "failed" ? "error" : "success",
    })),
  ];

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export async function resolveTransaction(paymentId, { note = "" } = {}) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;

  const updated = await Payment.findByIdAndUpdate(
    paymentId,
    {
      $set: {
        reconciliationReviewedAt: new Date(),
        reconciliationNote: String(note || "").trim(),
      },
    },
    { new: true }
  ).lean();

  return updated;
}
