const fs = require("fs");
const file = "backend/controllers/paymentController.js";
let c = fs.readFileSync(file, "utf8");

if (!c.includes('from "../utils/pricing.js"')) {
  c = c.replace(
    'import { normalizePhone } from "../utils/phone.js";',
    'import { normalizePhone } from "../utils/phone.js";\r\nimport { calculateRegistrationTotal, sumSuccessfulPayments } from "../utils/pricing.js";'
  );
}

c = c.replace("let { eventId, phone } = req.body;", "let { eventId, phone, guestCount = 0 } = req.body;");

const oldSuccess = `    // ONLY SUCCESS BLOCK\r\n    const successExists = await Payment.findOne({\r\n      eventId,\r\n      phone: cleanPhone,\r\n      status: "success",\r\n    });\r\n\r\n    if (successExists) {\r\n      return res.status(409).json({\r\n        success: false,\r\n        message: "Already paid",\r\n      });\r\n    }`;

const newSuccess = `    const guests = Math.max(0, Number(guestCount) || 0);\r\n    const { total: requiredTotal, breakdown } = calculateRegistrationTotal(event, guests);\r\n\r\n    if (requiredTotal <= 0) {\r\n      return res.status(200).json({\r\n        success: true,\r\n        message: "No payment required",\r\n        paymentRequired: false,\r\n        requiredTotal: 0,\r\n        breakdown,\r\n      });\r\n    }\r\n\r\n    const successPayments = await Payment.find({\r\n      eventId,\r\n      phone: cleanPhone,\r\n      status: "success",\r\n    }).select("amount guestCount breakdown");\r\n\r\n    const paidTotal = sumSuccessfulPayments(successPayments);\r\n\r\n    if (paidTotal >= requiredTotal) {\r\n      return res.status(409).json({\r\n        success: false,\r\n        message: "Already paid",\r\n        paidTotal,\r\n        requiredTotal,\r\n      });\r\n    }\r\n\r\n    const orderAmount = requiredTotal - paidTotal;`;

if (!c.includes(oldSuccess)) { console.error("MISS success"); process.exit(1); }
c = c.replace(oldSuccess, newSuccess);

const oldOrder = `    const order = await razorpay.orders.create({\r\n      amount: event.price * 100,\r\n      currency: "INR",\r\n      receipt: \`rcpt_\${Date.now()}\`,\r\n      notes: { eventId, phone: cleanPhone },\r\n    });\r\n\r\n    await Payment.create({\r\n      eventId,\r\n      phone: cleanPhone,\r\n      razorpay_order_id: order.id,\r\n      amount: event.price,\r\n      currency: "INR",\r\n      status: "created",\r\n    });`;

const newOrder = `    const order = await razorpay.orders.create({\r\n      amount: Math.round(orderAmount * 100),\r\n      currency: "INR",\r\n      receipt: \`rcpt_\${Date.now()}\`,\r\n      notes: { eventId, phone: cleanPhone, guestCount: String(guests) },\r\n    });\r\n\r\n    await Payment.create({\r\n      eventId,\r\n      phone: cleanPhone,\r\n      razorpay_order_id: order.id,\r\n      amount: orderAmount,\r\n      guestCount: guests,\r\n      breakdown,\r\n      currency: "INR",\r\n      status: "created",\r\n    });`;

if (!c.includes(oldOrder)) { console.error("MISS order"); process.exit(1); }
c = c.replace(oldOrder, newOrder);

c = c.replace('}).select("status paidAt razorpay_order_id");', '}).select("status paidAt razorpay_order_id amount guestCount breakdown");');

const oldReturn = `    return res.status(200).json({\r\n      success: true,\r\n      status: payment.status, // created | success | failed\r\n      paidAt: payment.paidAt || null,\r\n      orderId: payment.razorpay_order_id || null,\r\n    });`;

const newReturn = `    const successPayments = await Payment.find({\r\n      eventId,\r\n      phone: cleanPhone,\r\n      status: "success",\r\n    }).select("amount guestCount breakdown paidAt");\r\n\r\n    const paidTotal = sumSuccessfulPayments(successPayments);\r\n\r\n    return res.status(200).json({\r\n      success: true,\r\n      status: payment.status,\r\n      paidAt: payment.paidAt || null,\r\n      orderId: payment.razorpay_order_id || null,\r\n      amount: payment.amount ?? null,\r\n      guestCount: payment.guestCount ?? 0,\r\n      breakdown: payment.breakdown ?? null,\r\n      paidTotal,\r\n      successPayments,\r\n    });`;

if (!c.includes(oldReturn)) { console.error("MISS return"); process.exit(1); }
c = c.replace(oldReturn, newReturn);

fs.writeFileSync(file, c);
console.log("OK paymentController");
