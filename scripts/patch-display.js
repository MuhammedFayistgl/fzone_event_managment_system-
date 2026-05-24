const fs = require("fs");

function patch(file, search, replace) {
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes(search)) { console.error("MISS", file); process.exit(1); }
  fs.writeFileSync(file, c.replace(search, replace));
  console.log("OK", file);
}

// RegisterInfo
patch("frontend/src/components/register/RegisterInfo.tsx",
  'import { formatDayDate, formatDayTime, formatRegWindow } from "../../utils/eventFormat";',
  'import { formatDayDate, formatDayTime, formatRegWindow } from "../../utils/eventFormat";\r\nimport { formatEventPricingLabel } from "../../utils/pricing";');

patch("frontend/src/components/register/RegisterInfo.tsx",
  '          <span>{event?.isPaid ? `₹${event?.price ?? 0}` : "Free"}</span>',
  '          <span>{formatEventPricingLabel(event)}</span>');

// EventFormPreview
patch("frontend/src/components/event/EventFormPreview.tsx",
  'import { useAppSelector } from "../../hooks/hooks";',
  'import { useAppSelector } from "../../hooks/hooks";\r\nimport { formatEventPricingLabel } from "../../utils/pricing";');

patch("frontend/src/components/event/EventFormPreview.tsx",
  '          {form.isPaid ? `₹${form.price || 0}` : "Free"}',
  '          {formatEventPricingLabel(form)}');

// EventCard
patch("frontend/src/components/event/EventCard.tsx",
  'import toast from "react-hot-toast";',
  'import toast from "react-hot-toast";\r\nimport { formatEventPricingLabel } from "../../utils/pricing";');

patch("frontend/src/components/event/EventCard.tsx",
  '  isPaid: boolean;\r\n  price?: number;\r\n  eventDays: any[];',
  '  isPaid: boolean;\r\n  price?: number;\r\n  investorIsFree?: boolean;\r\n  investorPrice?: number;\r\n  guestPaymentEnabled?: boolean;\r\n  guestPrice?: number;\r\n  freeGuestCount?: number;\r\n  eventDays: any[];');

patch("frontend/src/components/event/EventCard.tsx",
  '          {event.isPaid ? (\r\n            <span className="text-emerald-400 font-semibold">₹{event.price}</span>\r\n          ) : (\r\n            <span className="text-emerald-400 font-semibold">Free</span>\r\n          )}',
  '          <span className="text-emerald-400 font-semibold text-sm">{formatEventPricingLabel(event)}</span>');

// e2e script
patch("backend/scripts/e2eRegistrationNameTest.js",
  '    amount: event.price || 100,',
  '    amount: event.investorPrice || event.price || 100,\r\n    guestCount: 0,');
