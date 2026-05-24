const fs = require("fs");
function patch(file, search, replace) {
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes(search)) { console.error("MISS", file, search.slice(0,80)); process.exit(1); }
  fs.writeFileSync(file, c.replace(search, replace));
  console.log("OK", file);
}

patch("backend/controllers/eventController.js",
  'import {\r\n  buildInvestorLookupByPhone,\r\n  repairRegistrationInvestorIds,\r\n  formatRegistrationInvestor,\r\n} from "../utils/resolveRegistrationInvestors.js";',
  'import {\r\n  buildInvestorLookupByPhone,\r\n  repairRegistrationInvestorIds,\r\n  formatRegistrationInvestor,\r\n} from "../utils/resolveRegistrationInvestors.js";\r\nimport { applyPricingToPayload, validatePricingPayload } from "../utils/pricing.js";');

patch("backend/controllers/eventController.js",
  `    // ================= PAYMENT =================\r\n    if (data.isPaid && data.price <= 0) {\r\n      return res.status(400).json({\r\n        success: false,\r\n        message: "Invalid price"\r\n      });\r\n    }\r\n\r\n    if (!data.isPaid) {\r\n      data.price = 0;\r\n    }`,
  `    // ================= PAYMENT =================\r\n    Object.assign(data, applyPricingToPayload(data));\r\n    const pricingErrors = validatePricingPayload(data);\r\n    if (pricingErrors.length) {\r\n      return res.status(400).json({ success: false, message: pricingErrors[0] });\r\n    }`);

patch("backend/controllers/eventController.js",
  `    // ================= PAYMENT =================\r\n    if (data.isPaid !== undefined) {\r\n      if (data.isPaid && data.price <= 0) {\r\n        return res.status(400).json({\r\n          success: false,\r\n          message: "Invalid price"\r\n        });\r\n      }\r\n\r\n      if (!data.isPaid) {\r\n        data.price = 0;\r\n      }\r\n    }`,
  `    // ================= PAYMENT =================\r\n    if (data.isPaid !== undefined || data.investorPrice !== undefined || data.guestPrice !== undefined) {\r\n      const merged = applyPricingToPayload({ ...existingEvent.toObject(), ...data });\r\n      Object.assign(data, merged);\r\n      const pricingErrors = validatePricingPayload(merged);\r\n      if (pricingErrors.length) {\r\n        return res.status(400).json({ success: false, message: pricingErrors[0] });\r\n      }\r\n    }`);

patch("backend/controllers/eventController.js",
  `.select("title description location eventDays createdAt isRegistrationClosed isPaid price locationType ticketDesign")`,
  `.select("title description location eventDays createdAt isRegistrationClosed isPaid price investorIsFree investorPrice guestPaymentEnabled guestPrice freeGuestCount allowGuests maxPerUser locationType ticketDesign")`);
