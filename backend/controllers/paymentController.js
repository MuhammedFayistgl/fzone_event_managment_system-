import crypto from "crypto";
import * as dotenv from "dotenv";
import eventModel from "../models/eventModel.js";

import Payment from "../models/paymentModel.js";
import razorpay from "../utils/razorpayClient.js";
import { normalizePhone, registrationPhoneQuery } from "../utils/phone.js";
import { calculateRegistrationTotal, sumSuccessfulPayments } from "../utils/pricing.js";
import { notifyDashboardMetricsChanged } from "../utils/dashboardCache.js";
import { processRefundWebhook, buildUserRefundSummary, formatUserPaymentRecord, syncAccessAfterRefund } from "../utils/paymentRefund.js";
import { recordWebhookDelivery } from "./platformController.js";
import { notifyUser } from "../utils/notifications.js";
dotenv.config();

async function fetchPaymentSummary(eventId, phone, guestCount = 0) {
  const normalized = normalizePhone(phone);
  const phoneQuery = normalized.valid
    ? registrationPhoneQuery(normalized)
    : { phone: String(phone) };

  const successPayments = await Payment.find({
    eventId,
    ...phoneQuery,
    status: "success",
  })
    .select("amount guestCount breakdown paidAt razorpay_order_id")
    .sort({ paidAt: 1 });

  const paidTotal = sumSuccessfulPayments(successPayments);

  const event = await eventModel.findById(eventId).lean();
  const guests = Math.max(0, Number(guestCount) || 0);
  const { total: requiredTotal, breakdown } = event
    ? calculateRegistrationTotal(event, guests)
    : { total: 0, breakdown: null };

  return {
    paidTotal,
    requiredTotal,
    guestCount: guests,
    breakdown,
    successPayments,
    amountDue: Math.max(0, requiredTotal - paidTotal),
  };
}

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    let { eventId, phone, guestCount = 0 } = req.body;

    if (!eventId || !phone) {
      return res.status(400).json({
        success: false,
        message: "Event ID and phone are required",
      });
    }

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const cleanPhone = normalized.string;

    const event = await eventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const now = new Date();

    const registrationClosed =
      event.isRegistrationClosed ||
      (event.eventDays?.length > 0 &&
        event.eventDays.every((d) => new Date(d.endTime) < now));

    if (registrationClosed) {
      return res.status(403).json({
        success: false,
        message: "Registration closed",
      });
    }

    if (event.registrationStart && now < event.registrationStart) {
      return res.status(403).json({
        success: false,
        message: "Registration not started",
      });
    }

    if (event.registrationDeadline && now > event.registrationDeadline) {
      return res.status(403).json({
        success: false,
        message: "Registration closed",
      });
    }

    const guests = Math.max(0, Number(guestCount) || 0);
    const { total: requiredTotal, breakdown } = calculateRegistrationTotal(event, guests);

    if (requiredTotal <= 0) {
      return res.status(200).json({
        success: true,
        message: "No payment required",
        paymentRequired: false,
        requiredTotal: 0,
        breakdown,
      });
    }

    const successPayments = await Payment.find({
      eventId,
      ...registrationPhoneQuery(normalized),
      status: "success",
    }).select("amount guestCount breakdown paidAt");

    const paidTotal = sumSuccessfulPayments(successPayments);

    if (paidTotal >= requiredTotal) {
      return res.status(409).json({
        success: false,
        message: "Already paid",
        paidTotal,
        requiredTotal,
      });
    }

    const orderAmount = requiredTotal - paidTotal;

    // REUSE ACTIVE ORDER
    const existingOrder = await Payment.findOne({
      eventId,
      phone: cleanPhone,
      status: "created",
      createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (existingOrder && existingOrder.amount === orderAmount && existingOrder.guestCount === guests) {
      const order = await razorpay.orders.fetch(existingOrder.razorpay_order_id);

      return res.status(200).json({
        success: true,
        message: "Existing order reused",
        order,
        key: process.env.RAZORPAY_KEY_ID,
        paidTotal,
        requiredTotal,
        orderAmount,
        breakdown,
      });
    }

    // EXPIRE OLD ORDERS
    await Payment.updateMany(
      { eventId, phone: cleanPhone, status: "created" },
      { status: "failed", failedAt: new Date() }
    );

    const order = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { eventId, phone: cleanPhone, guestCount: String(guests) },
    });

    await Payment.create({
      eventId,
      phone: cleanPhone,
      razorpay_order_id: order.id,
      amount: orderAmount,
      guestCount: guests,
      breakdown,
      currency: "INR",
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      paidTotal,
      requiredTotal,
      orderAmount,
      breakdown,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};
// VERIFY




export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing data",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const payment = await Payment.findOne({ razorpay_order_id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ALREADY SUCCESS → DO NOT ERROR
    if (payment.status === "success") {
      const summary = await fetchPaymentSummary(
        payment.eventId,
        payment.phone,
        payment.guestCount ?? 0
      );
      return res.status(200).json({
        success: true,
        message: "Already verified",
        amount: payment.amount,
        ...summary,
      });
    }

    const updated = await Payment.findOneAndUpdate(
      { razorpay_order_id, status: { $ne: "success" } },
      {
        $set: {
          razorpay_payment_id,
          razorpay_signature,
          status: "success",
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      const summary = await fetchPaymentSummary(
        payment.eventId,
        payment.phone,
        payment.guestCount ?? 0
      );
      return res.status(200).json({
        success: true,
        message: "Already processed",
        amount: payment.amount,
        ...summary,
      });
    }

    await eventModel.updateOne(
      { _id: payment.eventId },
      { $inc: { registeredCount: 1 } }
    );

    await notifyDashboardMetricsChanged();

    const summary = await fetchPaymentSummary(
      updated.eventId,
      updated.phone,
      updated.guestCount ?? 0
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified",
      amount: updated.amount,
      ...summary,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
}; 



export const markPaymentFailed = async (req, res) => {
  try {
    const { eventId, phone } = req.body;

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const cleanPhone = normalized.string;

    await Payment.updateMany(
      {
        eventId,
        phone: cleanPhone,
        status: "created",
      },
      {
        status: "failed",
        failedAt: new Date(),
      }
    );

    return res.json({
      success: true,
      message: "Marked failed",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};


export const getPaymentStatus = async (req, res) => {
  try {
    const { eventId, phone } = req.body;

    if (!eventId || !phone) {
      return res.status(400).json({
        success: false,
        message: "eventId and phone are required",
      });
    }

    const normalized = normalizePhone(phone);

    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message,
      });
    }

    const paymentQuery = {
      eventId,
      ...registrationPhoneQuery(normalized),
    };

    const paymentFields =
      "status paidAt razorpay_order_id amount guestCount breakdown refundAmount refunds";

    const [latestPayment, userPayments] = await Promise.all([
      Payment.findOne(paymentQuery).select(paymentFields).sort({ createdAt: -1 }),
      Payment.find({
        ...paymentQuery,
        status: { $in: ["success", "refunded"] },
      })
        .select(paymentFields)
        .sort({ paidAt: 1 }),
    ]);

    const refundSummary = buildUserRefundSummary(userPayments);
    const successPayments = userPayments.map(formatUserPaymentRecord);

    if (!latestPayment) {
      return res.status(200).json({
        success: true,
        status: refundSummary.paidTotal > 0 ? "success" : "not_found",
        paidTotal: refundSummary.paidTotal,
        grossPaidTotal: refundSummary.grossPaidTotal,
        totalRefunded: refundSummary.totalRefunded,
        refundStatus: refundSummary.refundStatus,
        refunds: refundSummary.refunds,
        successPayments,
      });
    }

    return res.status(200).json({
      success: true,
      status: latestPayment.status,
      paidAt: latestPayment.paidAt || null,
      orderId: latestPayment.razorpay_order_id || null,
      amount: latestPayment.amount ?? null,
      guestCount: latestPayment.guestCount ?? 0,
      breakdown: latestPayment.breakdown ?? null,
      paidTotal: refundSummary.paidTotal,
      grossPaidTotal: refundSummary.grossPaidTotal,
      totalRefunded: refundSummary.totalRefunded,
      refundStatus: refundSummary.refundStatus,
      refunds: refundSummary.refunds,
      successPayments,
    });
  } catch (err) {
    console.error("GET_PAYMENT_STATUS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ success: false, message: "Webhook secret missing" });
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ success: false, message: "Missing signature" });
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventType = payload?.event;

    if (eventType === "payment.captured") {
      const entity = payload?.payload?.payment?.entity;
      const orderId = entity?.order_id;
      const paymentId = entity?.id;

      if (!orderId || !paymentId) {
        return res.status(400).json({ success: false, message: "Invalid payload" });
      }

      const payment = await Payment.findOne({ razorpay_order_id: orderId });
      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      if (payment.status === "success") {
        return res.status(200).json({ success: true, message: "Already verified" });
      }

      const updated = await Payment.findOneAndUpdate(
        { razorpay_order_id: orderId, status: { $ne: "success" } },
        {
          $set: {
            razorpay_payment_id: paymentId,
            status: "success",
            paidAt: new Date(),
          },
        },
        { new: true }
      );

      if (updated) {
        await eventModel.updateOne(
          { _id: payment.eventId },
          { $inc: { registeredCount: 1 } }
        );
        await notifyDashboardMetricsChanged();

        const eventDoc = await eventModel.findById(payment.eventId).select("title").lean();
        notifyUser({
          phone: payment.phone,
          eventTitle: eventDoc?.title || "Event",
          template: "payment_success",
          message: `Payment of INR ${payment.amount} received for ${eventDoc?.title || "your event registration"}.`,
        }).catch(() => {});
      }

      await recordWebhookDelivery({
        eventType,
        entityId: paymentId,
        status: "processed",
        httpStatus: 200,
        payloadSummary: { orderId, paymentId },
      });

      return res.status(200).json({ success: true, message: "Webhook processed" });
    }

    if (
      eventType === "refund.created" ||
      eventType === "refund.processed" ||
      eventType === "refund.failed" ||
      eventType === "payment.refunded"
    ) {
      const refundEntity =
        payload?.payload?.refund?.entity || payload?.payload?.payment?.entity?.refunds?.[0];

      if (!refundEntity?.id) {
        return res.status(400).json({ success: false, message: "Invalid refund payload" });
      }

      try {
        const normalizedEvent =
          eventType === "payment.refunded" ? "refund.processed" : eventType;
        const { payment, changed } = await processRefundWebhook(refundEntity, normalizedEvent);

        if (changed) {
          await syncAccessAfterRefund(payment.eventId, payment.phone);
          await notifyDashboardMetricsChanged();
        }

        await recordWebhookDelivery({
          eventType: normalizedEvent,
          entityId: refundEntity.id,
          status: "processed",
          httpStatus: 200,
          payloadSummary: { paymentId: refundEntity.payment_id, amount: refundEntity.amount },
        });

        return res.status(200).json({ success: true, message: "Refund webhook processed" });
      } catch (refundErr) {
        await recordWebhookDelivery({
          eventType,
          entityId: refundEntity?.id || "",
          status: "failed",
          httpStatus: refundErr.message === "Payment not found" ? 200 : 500,
          errorMessage: refundErr.message,
        });

        if (refundErr.message === "Payment not found") {
          return res.status(200).json({ success: true, message: "Payment not found — acknowledged" });
        }
        throw refundErr;
      }
    }

    await recordWebhookDelivery({
      eventType: eventType || "unknown",
      status: "ignored",
      httpStatus: 200,
    });

    return res.status(200).json({ success: true, message: "Ignored event" });
  } catch (err) {
    console.error("RAZORPAY_WEBHOOK_ERROR:", err);
    await recordWebhookDelivery({
      eventType: "error",
      status: "failed",
      httpStatus: 500,
      errorMessage: err.message,
    });
    return res.status(500).json({ success: false, message: "Webhook failed" });
  }
};
