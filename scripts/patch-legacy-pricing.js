const fs = require("fs");

function addLegacyFallback(c) {
  const needle = "if (plain.investorPrice == null && plain.price != null) plain.investorPrice = plain.price;";
  const replacement = `if (plain.investorPrice == null && plain.price != null) plain.investorPrice = plain.price;
  if (plain.isPaid && Number(plain.price) > 0 && Number(plain.investorPrice) === 0 && !plain.guestPaymentEnabled) {
    plain.investorPrice = Number(plain.price);
    plain.investorIsFree = false;
  }`;
  return c.replace(needle, replacement);
}

for (const file of ["backend/utils/pricing.js", "frontend/src/utils/pricing.ts"]) {
  let c = fs.readFileSync(file, "utf8");
  c = addLegacyFallback(c);
  fs.writeFileSync(file, c);
  console.log("legacy fix", file);
}
