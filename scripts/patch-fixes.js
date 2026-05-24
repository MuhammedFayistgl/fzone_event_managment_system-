const fs = require("fs");
let c = fs.readFileSync("backend/controllers/paymentController.js", "utf8");
c = c.replace(
  "if (existingOrder) {",
  "if (existingOrder && existingOrder.amount === orderAmount && existingOrder.guestCount === guests) {"
);
fs.writeFileSync("backend/controllers/paymentController.js", c);

let d = fs.readFileSync("frontend/src/pages/attendence_Page/EventRegistorDataTable.tsx", "utf8");
d = d.split('payment?.status === "paid"').join('payment?.status === "success"');
fs.writeFileSync("frontend/src/pages/attendence_Page/EventRegistorDataTable.tsx", d);

let p = fs.readFileSync("frontend/src/utils/pricing.ts", "utf8");
p = p.replace(
  "export function normalizeEventPricing(event: EventPricingFields | null | undefined) {\r\n  if (!event) return event as EventPricingFields;",
  "export function normalizeEventPricing(event: EventPricingFields | null | undefined): EventPricingFields {\r\n  if (!event) return { isPaid: false, price: 0, investorIsFree: true, investorPrice: 0, guestPaymentEnabled: false, guestPrice: 0, freeGuestCount: 0 };"
);
fs.writeFileSync("frontend/src/utils/pricing.ts", p);

let e = fs.readFileSync("frontend/src/pages/EventRegisterPage.tsx", "utf8");
e = e.replace("[paymentStatus, setPaymentStatus]", "[, setPaymentStatus]");
fs.writeFileSync("frontend/src/pages/EventRegisterPage.tsx", e);

console.log("fixes applied");
