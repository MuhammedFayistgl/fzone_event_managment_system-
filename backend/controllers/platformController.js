import mongoose from "mongoose";
import eventModel from "../models/eventModel.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import Payment from "../models/paymentModel.js";
import Investor from "../models/Investor.js";
import AuditLog from "../models/auditLogModel.js";
import WebhookDelivery from "../models/webhookDeliveryModel.js";
import WaitlistEntry from "../models/waitlistModel.js";
import {
  buildInvestorLookupByPhone,
  formatRegistrationInvestor,
  repairRegistrationInvestorIds,
} from "../utils/resolveRegistrationInvestors.js";
import { getOrgSettings, updateOrgSettings } from "../utils/appSettings.js";
import { logAuditAction } from "../utils/auditLog.js";
import { createNotification } from "../services/notificationService.js";
import {
  getRefundableRemaining,
  mapRefundEntry,
  getActiveRefundTotal,
  getProcessedRefundTotal,
} from "../utils/paymentRefund.js";
import { getNetPaymentAmount } from "../utils/paymentRefund.js";
import razorpay, { isRazorpayConfigured } from "../utils/razorpayClient.js";
import {
  getSummary,
  getEnrichedPayments,
  getTransactionDetail,
  buildAnalytics,
  getActivityFeed,
  resolveTransaction,
} from "../services/reconciliationService.js";
import {
  buildSummary as buildAuditSummary,
  listAuditLogs,
  getAuditLogDetail as fetchAuditLogDetail,
  buildAnalytics as buildAuditAnalytics,
  exportAuditLogs,
} from "../services/auditLogService.js";
import {
  buildSummary as buildWebhookSummary,
  listWebhookDeliveries,
  getWebhookDetail as fetchWebhookDetail,
  buildAnalytics as buildWebhookAnalytics,
  exportWebhookDeliveries,
} from "../services/webhookDeliveryService.js";

function buildPaymentLedgerQuery(body = {}) {
  const { eventId, status, search, dateFrom, dateTo } = body;
  const query = {};

  if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
    query.eventId = eventId;
  }

  if (status && status !== "all") {
    query.status = status;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search && String(search).trim()) {
    const term = String(search).trim();
    query.$or = [
      { phone: { $regex: term, $options: "i" } },
      { razorpay_order_id: { $regex: term, $options: "i" } },
      { razorpay_payment_id: { $regex: term, $options: "i" } },
    ];
  }

  return query;
}

function formatAllRegistrationRow(registration, investorByPhone) {
  const investor = formatRegistrationInvestor(registration, investorByPhone);
  const guestCount = registration.participants?.length || 0;
  const anyCheckedIn =
    registration.isCheckedIn ||
    (registration.participants || []).some((guest) => guest.isCheckedIn);
  const anyBlocked =
    registration.isBlocked ||
    (registration.participants || []).some((guest) => guest.isBlocked);

  return {
    id: String(registration._id),
    registrationId: String(registration._id),
    name: investor?.Name || registration.investorName || "Unknown",
    phone: registration.phone,
    category: investor?.role || "Investor",
    eventId: registration.eventId?._id || registration.eventId,
    eventTitle: registration.eventId?.title || "Event",
    guestCount,
    passStatus: registration.qrToken ? "RELEASED" : "PENDING",
    checkIn: anyCheckedIn,
    blocked: anyBlocked,
    time: registration.createdAt,
    createdAt: registration.createdAt,
  };
}

export const getPlatformSettings = async (_req, res) => {
  try {
    const settings = await getOrgSettings(true);
    const safe = {
      ...settings,
      notifications: {
        ...settings.notifications,
        smtpPass: settings.notifications?.smtpPass ? "********" : "",
        twilioAuthToken: settings.notifications?.twilioAuthToken ? "********" : "",
      },
    };
    return res.json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const patchPlatformSettings = async (req, res) => {
  try {
    const updated = await updateOrgSettings(req.body || {});
    await logAuditAction({
      action: "settings.updated",
      category: "settings",
      actor: req.user,
      metadata: {
        refundAccessPolicy: updated.refundAccessPolicy,
        waitlistEnabled: updated.waitlistEnabled,
      },
      req,
    });

    createNotification("settings.updated", {
      sender: req.user,
    }).catch(() => {});

    return res.json({
      success: true,
      message: "Settings updated",
      data: {
        ...updated,
        notifications: {
          ...updated.notifications,
          smtpPass: updated.notifications?.smtpPass ? "********" : "",
          twilioAuthToken: updated.notifications?.twilioAuthToken ? "********" : "",
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const data = await listAuditLogs(req.query, {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuditLogSummary = async (req, res) => {
  try {
    const data = await buildAuditSummary(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuditLogDetail = async (req, res) => {
  try {
    const data = await fetchAuditLogDetail(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Audit entry not found" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuditLogAnalytics = async (req, res) => {
  try {
    const data = await buildAuditAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportAuditLogsHandler = async (req, res) => {
  try {
    const filters = { ...(req.body || {}), ...(req.query || {}) };
    const rows = await exportAuditLogs(filters);

    await logAuditAction({
      action: "audit.export",
      category: "export",
      actor: req.user,
      metadata: { count: rows.length },
      req,
    });

    return res.json({ success: true, data: { rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWebhookDeliveries = async (req, res) => {
  try {
    const data = await listWebhookDeliveries(req.query, {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWebhookSummary = async (req, res) => {
  try {
    const data = await buildWebhookSummary(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWebhookDetail = async (req, res) => {
  try {
    const data = await fetchWebhookDetail(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Webhook delivery not found" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWebhookAnalytics = async (req, res) => {
  try {
    const data = await buildWebhookAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportWebhooksHandler = async (req, res) => {
  try {
    const filters = { ...(req.body || {}), ...(req.query || {}) };
    const rows = await exportWebhookDeliveries(filters);

    await logAuditAction({
      action: "webhooks.export",
      category: "webhook",
      actor: req.user,
      metadata: { count: rows.length },
      req,
    });

    return res.json({ success: true, data: { rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllRegistrations = async (req, res) => {
  try {
    const page = Math.max(Number(req.body?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.body?.limit) || 25, 1), 100);
    const search = String(req.body?.search || "").trim();
    const eventId = req.body?.eventId;

    const query = {};
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.eventId = eventId;
    }

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { investorName: { $regex: search, $options: "i" } },
        { investorCode: { $regex: search, $options: "i" } },
      ];
    }

    const [registrations, total] = await Promise.all([
      RegEventModel.find(query)
        .populate({ path: "eventId", select: "title startTime endTime" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RegEventModel.countDocuments(query),
    ]);

    const investorByPhone = await buildInvestorLookupByPhone(
      registrations.map((row) => row.phone)
    );

    return res.json({
      success: true,
      data: {
        registrations: registrations.map((row) =>
          formatAllRegistrationRow(row, investorByPhone)
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportAllRegistrations = async (req, res) => {
  try {
    const search = String(req.body?.search || "").trim();
    const eventId = req.body?.eventId;
    const query = {};

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.eventId = eventId;
    }
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { investorName: { $regex: search, $options: "i" } },
      ];
    }

    const registrations = await RegEventModel.find(query)
      .populate({ path: "eventId", select: "title" })
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const investorByPhone = await buildInvestorLookupByPhone(
      registrations.map((row) => row.phone)
    );

    const rows = registrations.map((row) =>
      formatAllRegistrationRow(row, investorByPhone)
    );

    await logAuditAction({
      action: "registrations.export",
      category: "export",
      actor: req.user,
      metadata: { count: rows.length, eventId: eventId || "all" },
      req,
    });

    return res.json({ success: true, data: { rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportPaymentLedgerAll = async (req, res) => {
  try {
    const query = buildPaymentLedgerQuery(req.body || {});
    const payments = await Payment.find(query)
      .populate("eventId", "title isRefundable")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const phones = payments.map((p) => p.phone);
    const investorByPhone = await buildInvestorLookupByPhone(phones);

    const rows = payments.map((payment) => {
      const phoneKey = String(payment.phone || "").replace(/\D/g, "");
      const investor = investorByPhone.get(phoneKey) || null;
      const eventDoc = payment.eventId;

      return {
        _id: payment._id,
        event: eventDoc?.title || "",
        investorName: investor?.Name || "",
        phone: payment.phone,
        amount: payment.amount,
        currency: payment.currency || "INR",
        status: payment.status,
        method: payment.method || "",
        guestCount: payment.guestCount ?? 0,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id || "",
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        refundAmount: getActiveRefundTotal(payment),
      };
    });

    await logAuditAction({
      action: "payments.export",
      category: "export",
      actor: req.user,
      metadata: { count: rows.length },
      req,
    });

    return res.json({ success: true, data: { rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getFinanceReconciliation = async (req, res) => {
  try {
    const data = await getSummary(req.query);
    const mismatchCount = data?.disputed?.value ?? 0;
    if (mismatchCount > 0) {
      createNotification("reconciliation.mismatch", {
        count: mismatchCount,
        entity: { type: "reconciliation", id: "summary" },
      }).catch(() => {});
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getReconciliationSummary = getFinanceReconciliation;

export const getReconciliationTransactions = async (req, res) => {
  try {
    const { rows, total, page, limit } = await getEnrichedPayments(req.query, {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    return res.json({
      success: true,
      data: {
        rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getReconciliationTransactionDetail = async (req, res) => {
  try {
    const detail = await getTransactionDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    return res.json({ success: true, data: detail });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getReconciliationAnalytics = async (req, res) => {
  try {
    const data = await buildAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getReconciliationActivity = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const data = await getActivityFeed(limit);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const exportReconciliation = async (req, res) => {
  try {
    const filters = { ...(req.body || {}), ...(req.query || {}) };
    const { rows } = await getEnrichedPayments(filters, { page: 1, limit: 10000 });

    await logAuditAction({
      action: "reconciliation.export",
      category: "export",
      actor: req.user,
      metadata: { count: rows.length },
      req,
    });

    return res.json({ success: true, data: { rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resolveReconciliationTransaction = async (req, res) => {
  try {
    const { note } = req.body || {};
    const updated = await resolveTransaction(req.params.id, { note });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    await logAuditAction({
      action: "reconciliation.resolve",
      category: "payment",
      actor: req.user,
      targetType: "payment",
      targetId: String(updated._id),
      phone: updated.phone,
      metadata: { note },
      req,
    });

    const detail = await getTransactionDetail(req.params.id);
    return res.json({ success: true, data: detail, message: "Marked as reconciled" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWaitlist = async (req, res) => {
  try {
    const eventId = req.query.eventId;
    const query = eventId ? { eventId } : {};
    const rows = await WaitlistEntry.find(query).sort({ createdAt: 1 }).lean();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getGateNames = async (_req, res) => {
  try {
    const settings = await getOrgSettings();
    return res.json({ success: true, data: settings.gateNames || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export async function recordWebhookDelivery({
  eventType,
  entityId = "",
  status = "received",
  httpStatus = null,
  errorMessage = "",
  payloadSummary = {},
}) {
  try {
    await WebhookDelivery.create({
      provider: "razorpay",
      eventType,
      entityId,
      status,
      httpStatus,
      errorMessage,
      payloadSummary,
      processedAt: status === "processed" ? new Date() : null,
    });

    if (status === "failed") {
      await logAuditAction({
        action: "webhook.delivery_failed",
        category: "webhook",
        targetType: "webhook",
        targetId: entityId || eventType,
        metadata: { eventType, httpStatus, errorMessage, payloadSummary },
      });

      createNotification("webhook.delivery_failed", {
        eventType,
        entityId,
        errorMessage,
        metadata: { httpStatus, payloadSummary },
      }).catch(() => {});
    }
  } catch (err) {
    console.error("WEBHOOK_DELIVERY_LOG_ERROR:", err.message);
  }
}
