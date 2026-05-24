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
import {
  getRefundableRemaining,
  mapRefundEntry,
  getActiveRefundTotal,
  getProcessedRefundTotal,
} from "../utils/paymentRefund.js";
import { getNetPaymentAmount } from "../utils/paymentRefund.js";
import razorpay, { isRazorpayConfigured } from "../utils/razorpayClient.js";

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
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const category = req.query.category;
    const query = category ? { category } : {};

    const [rows, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getWebhookDeliveries = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const status = req.query.status;

    const query = status ? { status } : {};
    const [rows, total] = await Promise.all([
      WebhookDelivery.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      WebhookDelivery.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
    });
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
    const eventId = req.query.eventId;
    const paymentQuery = { status: { $in: ["success", "refunded"] } };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      paymentQuery.eventId = eventId;
    }

    const payments = await Payment.find(paymentQuery)
      .select("amount status refundAmount refunds razorpay_payment_id paidAt eventId phone")
      .lean();

    let ledgerGross = 0;
    let ledgerNet = 0;
    let ledgerRefunded = 0;
    let pendingRefunds = 0;

    for (const payment of payments) {
      const gross = Number(payment.amount || 0);
      const activeRefund = getActiveRefundTotal(payment);
      const processedRefund = getProcessedRefundTotal(payment);
      ledgerGross += gross;
      ledgerRefunded += processedRefund;
      ledgerNet += getNetPaymentAmount(payment);
      pendingRefunds += Math.max(0, activeRefund - processedRefund);
    }

    let razorpayCaptured = null;
    if (isRazorpayConfigured()) {
      try {
        const rpPayments = await razorpay.payments.all({ count: 100 });
        razorpayCaptured = (rpPayments?.items || [])
          .filter((item) => item.status === "captured")
          .reduce((sum, item) => sum + Number(item.amount || 0) / 100, 0);
      } catch (err) {
        razorpayCaptured = null;
      }
    }

    return res.json({
      success: true,
      data: {
        ledgerGross,
        ledgerNet,
        ledgerRefunded,
        pendingRefunds,
        razorpayCapturedSample: razorpayCaptured,
        paymentCount: payments.length,
        note:
          "Razorpay sample uses latest 100 captured payments. Use Razorpay dashboard for full settlement reconciliation.",
      },
    });
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
  } catch (err) {
    console.error("WEBHOOK_DELIVERY_LOG_ERROR:", err.message);
  }
}
