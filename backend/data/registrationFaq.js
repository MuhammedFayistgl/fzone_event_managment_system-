export const REGISTRATION_FAQ = [
  {
    id: "how_to_register",
    tags: ["register", "steps"],
    questionEn: "How do I register for this event?",
    answerEn:
      "Enter your 10-digit registered mobile number, verify it, add guests if allowed, complete payment if required, then tap Confirm Booking. Your digital pass with QR code will appear on this page.",
    questionMl: "ഈ ഇവന്റിൽ എങ്ങനെ രജിസ്റ്റർ ചെയ്യാം?",
    answerMl:
      "നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ നൽകി verify ചെയ്യുക. അനുവദിച്ചിട്ടുണ്ടെങ്കിൽ guest ചേർക്കുക. payment ആവശ്യമുണ്ടെങ്കിൽ അത് പൂർത്തിയാക്കി Confirm Booking അമർത്തുക. QR code ഉള്ള digital pass ഈ page-il തന്നെ കാണാം.",
    keywordsEn: ["register", "registration", "how", "steps", "book", "confirm"],
    keywordsMl: ["രജിസ്റ്റർ", "എങ്ങനെ", "booking", "confirm", "ചെയ്യാം"],
  },
  {
    id: "phone_not_found",
    tags: ["phone", "investor"],
    questionEn: "My phone number is not found",
    answerEn:
      "Only pre-registered investors can register. Your mobile must exist in the organizer's investor database. Contact event support with your name and investor ID to get added.",
    questionMl: "എന്റെ phone number കണ്ടില്ല",
    answerMl:
      "മുൻകൂട്ടി register ചെയ്ത investors-മാർക്ക് മാത്രമേ ഇവിടെ register ചെയ്യാൻ കഴിയൂ. നിങ്ങളുടെ number organizer-ന്റെ investor list-il ഉണ്ടായിരിക്കണം. support-നെ വിളിച്ച് name, investor ID എന്നിവ നൽകി list-il add ചെയ്യുക.",
    keywordsEn: ["phone", "not found", "invalid", "investor", "number", "missing"],
    keywordsMl: ["phone", "number", "കണ്ടില്ല", "invalid", "investor"],
  },
  {
    id: "guest_rules",
    tags: ["guest"],
    questionEn: "Can I add guests?",
    answerEn:
      "Guest registration depends on this event's settings. If guests are allowed, use the Guest section to add name, phone, and type before confirming booking. Extra guests may require payment.",
    questionMl: "guest ചേർക്കാമോ?",
    answerMl:
      "guest allow ചെയ്തിട്ടുണ്ടോ എന്ന് event settings-നെ ആശ്രയിച്ചിരിക്കുന്നു. allow ഉണ്ടെങ്കിൽ Guest section-ൽ name, phone, type നൽകി booking confirm ചെയ്യുക. കൂടുതൽ guests-ന് payment ആവശ്യമാകാം.",
    keywordsEn: ["guest", "guests", "add", "companion", "family"],
    keywordsMl: ["guest", "guests", "ചേർക്ക", "അതിഥി"],
  },
  {
    id: "payment_how",
    tags: ["payment", "razorpay"],
    questionEn: "How do I pay?",
    answerEn:
      "If payment is required, tap Pay Now to open Razorpay. Use UPI, card, or net banking. After successful payment, return here and tap Confirm Booking to finalize registration.",
    questionMl: "payment എങ്ങനെ ചെയ്യാം?",
    answerMl:
      "payment ആവശ്യമുണ്ടെങ്കിൽ Pay Now അമർത്തി Razorpay open ചെയ്യുക. UPI, card, net banking ഉപയോഗിക്കാം. payment success ആയ ശേഷം ഇവിടെ തിരിച്ചുവന്ന് Confirm Booking അമർത്തുക.",
    keywordsEn: ["pay", "payment", "razorpay", "upi", "card", "money", "fee"],
    keywordsMl: ["payment", "pay", "razorpay", "പണം", "fees", "എങ്ങനെ", "ചെയ്യാം"],
  },
  {
    id: "payment_failed",
    tags: ["payment"],
    questionEn: "My payment failed",
    answerEn:
      "If payment failed, wait a moment and try Pay Now again. Do not pay twice. If money was debited but registration did not update, contact support with your Razorpay payment ID.",
    questionMl: "payment failed ആയി",
    answerMl:
      "payment fail ആയാൽ കുറച്ച് കാത്ത് വീണ്ടും Pay Now try ചെയ്യുക. രണ്ട് തവണ pay ചെയ്യരുത്. amount debit ആയിട്ടും registration update ആയില്ലെങ്കിൽ Razorpay payment ID support-ന് അയയ്ക്കുക.",
    keywordsEn: ["failed", "payment failed", "error", "declined"],
    keywordsMl: ["failed", "payment", "error", "പരാജയം"],
  },
  {
    id: "qr_pass",
    tags: ["qr", "pass"],
    questionEn: "Where is my QR pass?",
    answerEn:
      "After Confirm Booking, your digital entry pass with QR code appears on this page. You can download the ticket. At the gate, staff scan the QR — the pass will show Pass used after check-in.",
    questionMl: "QR pass എവിടെ?",
    answerMl:
      "Confirm Booking-ന് ശേഷം QR code ഉള്ള digital pass ഈ page-il കാണാം. ticket download ചെയ്യാം. gate-il staff QR scan ചെയ്യും — check-in ആയാൽ Pass used എന്ന് കാണിക്കും.",
    keywordsEn: ["qr", "pass", "ticket", "download", "entry"],
    keywordsMl: ["qr", "pass", "ticket", "download", "പാസ്"],
  },
  {
    id: "checkin_gate",
    tags: ["checkin", "gate"],
    questionEn: "What happens at the gate?",
    answerEn:
      "Show your QR code on your phone at the event gate. Staff scan it once for entry. After check-in, the pass locks automatically — you cannot reuse the same QR.",
    questionMl: "gate-il എന്ത് ചെയ്യണം?",
    answerMl:
      "event gate-il phone-ൽ QR code കാണിച്ച് staff scan ചെയ്യും. ഒരു തവണ check-in ആയാൽ pass lock ആകും — അതേ QR വീണ്ടും use ചെയ്യാൻ പറ്റില്ല.",
    keywordsEn: ["gate", "check in", "checkin", "scan", "entry"],
    keywordsMl: ["gate", "check in", "scan", "entry", "ഗേറ്റ്"],
  },
  {
    id: "registration_closed",
    tags: ["closed"],
    questionEn: "Registration is closed",
    answerEn:
      "Registration may be closed because the deadline passed or the organizer closed it manually. You cannot register until the organizer reopens registration.",
    questionMl: "registration close ആയി",
    answerMl:
      "deadline കഴിഞ്ഞതോ organizer manually close ചെയ്തതോ കൊണ്ട് registration close ആയിരിക്കാം. organizer reopen ചെയ്യുന്നത് വരെ register ചെയ്യാൻ പറ്റില്ല.",
    keywordsEn: ["closed", "close", "deadline", "ended"],
    keywordsMl: ["close", "closed", "deadline", "അവസാനിച്ച"],
  },
  {
    id: "portal_vs_register",
    tags: ["portal"],
    questionEn: "What is the difference between registration page and portal?",
    answerEn:
      "The registration page (/event/...) is where you register, pay, and get your pass. The investor portal (/portal/...) is for viewing an existing pass after you already registered.",
    questionMl: "registration page-um portal-um എന്ത് വ്യത്യാസം?",
    answerMl:
      "registration page (/event/...) — register, payment, pass ലഭിക്കാൻ. investor portal (/portal/...) — മുൻപ് register ചെയ്ത pass view ചെയ്യാൻ മാത്രം.",
    keywordsEn: ["portal", "difference", "view pass"],
    keywordsMl: ["portal", "വ്യത്യാസം", "pass view"],
  },
  {
    id: "blocked_pass",
    tags: ["blocked"],
    questionEn: "Why is my pass blocked?",
    answerEn:
      "A pass may be blocked after refunds or payment policy rules. Contact event support if you believe this is a mistake. Blocked passes cannot be used for gate entry.",
    questionMl: "pass blocked എന്തുകൊണ്ട്?",
    answerMl:
      "refund അല്ലെങ്കിൽ payment policy കാരണം pass block ആകാം. mistake ആണെന്ന് തോന്നിയാൽ support-നെ ബന്ധപ്പെടുക. blocked pass gate entry-ക്ക് use ചെയ്യാൻ പറ്റില്ല.",
    keywordsEn: ["blocked", "block", "refund", "denied"],
    keywordsMl: ["blocked", "block", "refund", "തടഞ്ഞ"],
  },
  {
    id: "refund_status",
    tags: ["refund"],
    questionEn: "How do refunds work?",
    answerEn:
      "Refunds depend on event policy and are processed through Razorpay. If a refund affects your pass, you may see a banner on this page. Contact support for refund status.",
    questionMl: "refund എങ്ങനെ?",
    answerMl:
      "refund event policy-നും Razorpay-നും അനുസരിച്ചാണ്. refund pass-നെ ബാധിച്ചാൽ banner കാണാം. status അറിയാൻ support-നെ contact ചെയ്യുക.",
    keywordsEn: ["refund", "money back", "return"],
    keywordsMl: ["refund", "money back", "തിരിച്ച്"],
  },
  {
    id: "free_event",
    tags: ["free", "price"],
    questionEn: "Is this event free?",
    answerEn:
      "Check the pricing shown on this page. Free events skip payment and go straight to Confirm Booking after phone verification.",
    questionMl: "ഈ event free ആണോ?",
    answerMl:
      "ഈ page-il കാണുന്ന price നോക്കുക. free event-ൽ payment skip ചെയ്ത് phone verify ചെയ്ത ശേഷം Confirm Booking ചെയ്യാം.",
    keywordsEn: ["free", "cost", "price", "fee", "charge"],
    keywordsMl: ["free", "price", "fees", "സൗജന്യം"],
  },
  {
    id: "confirm_booking",
    tags: ["confirm"],
    questionEn: "What does Confirm Booking do?",
    answerEn:
      "Confirm Booking finalizes your registration and generates QR passes for you and your guests. Do this after payment (if required) is complete.",
    questionMl: "Confirm Booking എന്താണ്?",
    answerMl:
      "Confirm Booking registration finalize ചെയ്ത് നിങ്ങൾക്കും guests-നും QR pass generate ചെയ്യും. payment (ആവശ്യമുണ്ടെങ്കിൽ) complete ആയ ശേഷം ഇത് ചെയ്യുക.",
    keywordsEn: ["confirm", "booking", "finalize", "submit"],
    keywordsMl: ["confirm", "booking", "finalize"],
  },
  {
    id: "edit_guest",
    tags: ["guest", "delete"],
    questionEn: "Can I remove or edit a guest?",
    answerEn:
      "You can remove guests that are not yet fully registered, depending on event rules. Use the delete option in the Guest section before confirming booking.",
    questionMl: "guest edit/delete ചെയ്യാമോ?",
    answerMl:
      "event rules അനുസരിച്ച് fully register ആകാത്ത guests remove ചെയ്യാം. Confirm Booking-ന് മുമ്പ് Guest section-ൽ delete option use ചെയ്യുക.",
    keywordsEn: ["delete", "remove", "edit", "guest"],
    keywordsMl: ["delete", "remove", "guest", "നീക്ക"],
  },
  {
    id: "support_contact",
    tags: ["support", "help"],
    questionEn: "How do I contact support?",
    answerEn:
      "Use the contact details provided by the event organizer. If shown in settings, call or email support with your registered phone number and event name.",
    questionMl: "support-നെ എങ്ങനെ contact ചെയ്യാം?",
    answerMl:
      "event organizer നൽകിയ contact details use ചെയ്യുക. settings-il phone/email ഉണ്ടെങ്കിൽ registered number-ും event name-ും നൽകി contact ചെയ്യുക.",
    keywordsEn: ["support", "help", "contact", "call", "email"],
    keywordsMl: ["support", "help", "contact", "സഹായം"],
  },
];
