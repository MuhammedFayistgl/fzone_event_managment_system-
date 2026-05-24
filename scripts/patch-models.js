const fs = require("fs");
function patch(file, search, replace) {
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes(search)) { console.error("MISS", file); process.exit(1); }
  fs.writeFileSync(file, c.replace(search, replace));
  console.log("OK", file);
}
patch("backend/models/eventModel.js",
  "    price: {\r\n      type: Number,\r\n      default: 0\r\n    },\r\n\r\n    isRefundable:",
  "    price: {\r\n      type: Number,\r\n      default: 0\r\n    },\r\n\r\n    investorIsFree: { type: Boolean, default: false },\r\n    investorPrice: { type: Number, default: 0 },\r\n    guestPaymentEnabled: { type: Boolean, default: false },\r\n    guestPrice: { type: Number, default: 0 },\r\n    freeGuestCount: { type: Number, default: 0, min: 0 },\r\n\r\n    isRefundable:");
patch("backend/models/paymentModel.js",
  "    amount: {\r\n      type: Number,\r\n      required: true,\r\n      min: 0,\r\n    },\r\n\r\n    currency:",
  "    amount: {\r\n      type: Number,\r\n      required: true,\r\n      min: 0,\r\n    },\r\n\r\n    guestCount: { type: Number, default: 0, min: 0 },\r\n\r\n    breakdown: {\r\n      investorAmount: { type: Number, default: 0 },\r\n      guestAmount: { type: Number, default: 0 },\r\n      guestCount: { type: Number, default: 0 },\r\n      payableGuestCount: { type: Number, default: 0 },\r\n      freeGuestCount: { type: Number, default: 0 },\r\n    },\r\n\r\n    currency:");
