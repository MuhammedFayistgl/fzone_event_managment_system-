import crypto from "crypto";
import Razorpay from "razorpay";
import * as dotenv from "dotenv";
import eventModel from "../models/eventModel.js";

import Payment from "../models/paymentModel.js";
dotenv.config();


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    let { eventId, phone } = req.body;

    if (!eventId || !phone) {
      return res.status(400).json({
        success: false,
        message: "Event ID and phone are required",
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    const event = await eventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const now = new Date();

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

    // ONLY SUCCESS BLOCK
    const successExists = await Payment.findOne({
      eventId,
      phone: cleanPhone,
      status: "success",
    });

    if (successExists) {
      return res.status(409).json({
        success: false,
        message: "Already paid",
      });
    }

    // REUSE ACTIVE ORDER
    const existingOrder = await Payment.findOne({
      eventId,
      phone: cleanPhone,
      status: "created",
      createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (existingOrder) {
      const order = await razorpay.orders.fetch(existingOrder.razorpay_order_id);

      return res.status(200).json({
        success: true,
        message: "Existing order reused",
        order,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    // EXPIRE OLD ORDERS
    await Payment.updateMany(
      { eventId, phone: cleanPhone, status: "created" },
      { status: "failed", failedAt: new Date() }
    );

    const order = await razorpay.orders.create({
      amount: event.price * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { eventId, phone: cleanPhone },
    });

    await Payment.create({
      eventId,
      phone: cleanPhone,
      razorpay_order_id: order.id,
      amount: event.price,
      currency: "INR",
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
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
      return res.status(200).json({
        success: true,
        message: "Already verified",
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
      return res.status(200).json({
        success: true,
        message: "Already processed",
      });
    }

    await eventModel.updateOne(
      { _id: payment.eventId },
      { $inc: { registeredCount: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified",
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

    const cleanPhone = String(phone).replace(/\D/g, "");

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

    // ================= VALIDATION =================
    if (!eventId || !phone) {
      return res.status(400).json({
        success: false,
        message: "eventId and phone are required",
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // ================= FIND PAYMENT =================
    const payment = await Payment.findOne({
      eventId,
      phone: cleanPhone,
    }).select("status paidAt razorpay_order_id");

    if (!payment) {
      return res.status(200).json({
        success: true,
        status: "not_found",
      });
    }

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      status: payment.status, // created | success | failed
      paidAt: payment.paidAt || null,
      orderId: payment.razorpay_order_id || null,
    });

  } catch (err) {
    console.error("GET_PAYMENT_STATUS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

