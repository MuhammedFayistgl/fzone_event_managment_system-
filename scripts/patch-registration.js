const fs = require("fs");
const file = "backend/controllers/registrationController.js";
let c = fs.readFileSync(file, "utf8");

if (!c.includes('from "../utils/pricing.js"')) {
  c = c.replace(
    'import {\r\n  ensureParticipantPasses,\r\n  findPassByToken,\r\n} from "../utils/passQr.js";',
    'import {\r\n  ensureParticipantPasses,\r\n  findPassByToken,\r\n} from "../utils/passQr.js";\r\nimport { calculateRegistrationTotal, sumSuccessfulPayments } from "../utils/pricing.js";'
  );
}

const oldPayment = `    // ================= 4. CHECK PAYMENT =================\r\n    let payment = null;\r\n\r\n    if (event.isPaid) {\r\n      payment = await Payment.findOne({\r\n        eventId,\r\n        phone: phoneKey,\r\n        status: "success",\r\n      });\r\n\r\n      if (!payment) {\r\n        return res.status(400).json({\r\n          success: false,\r\n          message: "Payment not completed",\r\n        });\r\n      }\r\n    }`;

const newPayment = `    // ================= 4. CHECK PAYMENT (after guest count known) =================\r\n    let payment = null;`;

if (!c.includes(oldPayment)) { console.error("MISS payment block"); process.exit(1); }
c = c.replace(oldPayment, newPayment);

// Insert payment check helper before SAVE REGISTRATION - we need to check after we know finalParticipants
// For new registration path, guest count = participants.length
// For existing path, guest count = finalParticipants.length

const checkFn = `\r\nasync function assertPaymentCoversGuests(event, eventId, phoneKey, guestCount) {\r\n  const { total } = calculateRegistrationTotal(event, guestCount);\r\n  if (total <= 0) return null;\r\n  const successPayments = await Payment.find({ eventId, phone: phoneKey, status: "success" });\r\n  const paidTotal = sumSuccessfulPayments(successPayments);\r\n  if (paidTotal < total) {\r\n    return { ok: false, required: total, paid: paidTotal };\r\n  }\r\n  return { ok: true, payment: successPayments[successPayments.length - 1] };\r\n}\r\n`;

if (!c.includes("assertPaymentCoversGuests")) {
  c = c.replace("export const registerEvent = async (req, res) => {", checkFn + "\r\nexport const registerEvent = async (req, res) => {");
}

const beforeSameData = `      const oldData = normalize(existing.participants || []);\r\n      const newData = normalize(finalParticipants || []);`;

const withPaymentCheck = `      const paymentCheck = await assertPaymentCoversGuests(\r\n        event,\r\n        eventId,\r\n        phoneKey,\r\n        finalParticipants.length\r\n      );\r\n      if (paymentCheck && !paymentCheck.ok) {\r\n        return res.status(400).json({\r\n          success: false,\r\n          message: "Payment not completed for current guest count",\r\n          requiredTotal: paymentCheck.required,\r\n          paidTotal: paymentCheck.paid,\r\n        });\r\n      }\r\n      payment = paymentCheck?.payment ?? null;\r\n\r\n      const oldData = normalize(existing.participants || []);\r\n      const newData = normalize(finalParticipants || []);`;

if (!c.includes(beforeSameData)) { console.error("MISS beforeSameData"); process.exit(1); }
c = c.replace(beforeSameData, withPaymentCheck);

const beforeSave = `    // ================= 11. SAVE REGISTRATION + GENERATE PASSES =================\r\n    const registration = await RegEventModel.create({`;

const withNewRegPayment = `    const newRegPaymentCheck = await assertPaymentCoversGuests(\r\n      event,\r\n      eventId,\r\n      phoneKey,\r\n      participants.length\r\n    );\r\n    if (newRegPaymentCheck && !newRegPaymentCheck.ok) {\r\n      return res.status(400).json({\r\n        success: false,\r\n        message: "Payment not completed",\r\n        requiredTotal: newRegPaymentCheck.required,\r\n        paidTotal: newRegPaymentCheck.paid,\r\n      });\r\n    }\r\n    payment = newRegPaymentCheck?.payment ?? null;\r\n\r\n    // ================= 11. SAVE REGISTRATION + GENERATE PASSES =================\r\n    const registration = await RegEventModel.create({`;

if (!c.includes(beforeSave)) { console.error("MISS beforeSave"); process.exit(1); }
c = c.replace(beforeSave, withNewRegPayment);

fs.writeFileSync(file, c);
console.log("OK registrationController");
