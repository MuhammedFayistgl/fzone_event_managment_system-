const fs = require("fs");
const file = "frontend/src/redux/EventSlice.ts";
let c = fs.readFileSync(file, "utf8");

const oldSetForm = `    setFormData: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      state.form = {
        ...state.form,
        ...payload,
        ticketDesign: payload.ticketDesign ?? {
          mode: "default",
          textTheme: "dark",
          backgroundUrl: null,
        },
      };
    },`;

const newSetForm = `    setFormData: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      const investorPrice = Number(payload.investorPrice ?? payload.price ?? 0);
      const investorIsFree = payload.investorIsFree ?? (payload.isPaid ? investorPrice <= 0 : true);
      state.form = {
        ...state.form,
        ...payload,
        investorPrice,
        investorIsFree,
        guestPaymentEnabled: Boolean(payload.guestPaymentEnabled),
        guestPrice: Number(payload.guestPrice ?? 0),
        freeGuestCount: Number(payload.freeGuestCount ?? 0),
        ticketDesign: payload.ticketDesign ?? {
          mode: "default",
          textTheme: "dark",
          backgroundUrl: null,
        },
      };
    },`;

if (!c.includes(oldSetForm)) { console.error("MISS setFormData"); process.exit(1); }
c = c.replace(oldSetForm, newSetForm);
fs.writeFileSync(file, c);
console.log("OK EventSlice setFormData");
