import mongoose from "mongoose";
import * as dotenv from "dotenv";
import eventModel from "../models/eventModel.js";
import Payment from "../models/paymentModel.js";
import { calculateRegistrationTotal, sumSuccessfulPayments } from "../utils/pricing.js";
import { createOrder, getPaymentStatus } from "../controllers/paymentController.js";
import { registrationPhoneQuery } from "../utils/phone.js";
import { normalizePhone } from "../utils/phone.js";

dotenv.config();

const mockRes = () => {
  let body = null;
  let statusCode = 200;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      body = data;
      return data;
    },
    getBody: () => body,
    getStatus: () => statusCode,
  };
};

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fzone");

const event =
  (await eventModel
    .findOne({
      isPaid: true,
      allowGuests: true,
      guestPaymentEnabled: true,
      investorIsFree: true,
    })
    .lean()) ||
  (await eventModel.findOne({ isPaid: true }).lean());

if (!event) {
  console.error("No paid event found for test");
  process.exit(1);
}

const eventId = String(event._id);
const phone = "9999900001";
const normalized = normalizePhone(phone);
const phoneQuery = registrationPhoneQuery(normalized);

await Payment.deleteMany({ eventId, ...phoneQuery });

const results = [];

async function runCreateOrder(guestCount) {
  const res = mockRes();
  await createOrder({ body: { eventId, phone, guestCount } }, res);
  return { status: res.getStatus(), body: res.getBody() };
}

async function markSuccess(orderId) {
  const payment = await Payment.findOne({ razorpay_order_id: orderId });
  if (!payment) throw new Error(`Payment not found for ${orderId}`);
  payment.status = "success";
  payment.paidAt = new Date();
  payment.razorpay_payment_id = `test_pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await payment.save();
  return payment;
}

async function dbPaidTotal() {
  const rows = await Payment.find({ eventId, ...phoneQuery, status: "success" });
  return sumSuccessfulPayments(rows);
}

const order1 = await runCreateOrder(1);
results.push({
  step: "create_order_1_guest",
  status: order1.status,
  orderAmount: order1.body?.orderAmount,
  expectedAmount: calculateRegistrationTotal(event, 1).total,
  pass: order1.status === 200,
});

const orderId1 = order1.body?.order?.id;
await markSuccess(orderId1);

const dbAfter1 = await dbPaidTotal();
const statusAfter1 = mockRes();
await getPaymentStatus({ body: { eventId, phone } }, statusAfter1);
const apiPaidAfter1 = Number(statusAfter1.getBody()?.paidTotal ?? 0);
results.push({
  step: "paid_total_after_1_guest",
  dbPaidTotal: dbAfter1,
  apiPaidTotal: apiPaidAfter1,
  expected: calculateRegistrationTotal(event, 1).total,
  pass:
    dbAfter1 >= calculateRegistrationTotal(event, 1).total &&
    apiPaidAfter1 >= calculateRegistrationTotal(event, 1).total,
});

const order2 = await runCreateOrder(2);
const expectedDelta =
  calculateRegistrationTotal(event, 2).total - calculateRegistrationTotal(event, 1).total;
results.push({
  step: "create_order_2_guests_delta",
  status: order2.status,
  orderAmount: order2.body?.orderAmount,
  expectedDelta,
  pass: Number(order2.body?.orderAmount ?? -1) === expectedDelta,
});

const orderId2 = order2.body?.order?.id;
if (orderId2) await markSuccess(orderId2);

const order409 = await runCreateOrder(2);
results.push({
  step: "already_paid_409",
  status: order409.status,
  paidTotal: order409.body?.paidTotal,
  pass: order409.status === 409,
});

const sumPaid = await dbPaidTotal();
results.push({
  step: "sum_success_payments",
  sumPaid,
  requiredFor2: calculateRegistrationTotal(event, 2).total,
  pass: sumPaid >= calculateRegistrationTotal(event, 2).total,
});

const allPass = results.every((r) => r.pass !== false);
console.log(JSON.stringify({ eventId, phone, allPass, results }, null, 2));

await mongoose.disconnect();
process.exit(allPass ? 0 : 1);
