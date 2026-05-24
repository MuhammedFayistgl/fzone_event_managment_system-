const fs = require("fs");
const file = "frontend/src/redux/paymentSlice.ts";
let c = fs.readFileSync(file, "utf8");

c = c.replace(
`interface PaymentState {
    loading: boolean;
    order: any;
    error: string | null;
    verified: boolean;
    alreadyPaid: boolean;
}

const initialState: PaymentState = {
    loading: false,
    order: null,
    error: null,
    verified: false,
    alreadyPaid: false,
};
interface PaymentState {
    loading: boolean;
    order: any;
    error: string | null;

    // ✅ ADD THIS
}`,
`interface PaymentState {
    loading: boolean;
    order: any;
    error: string | null;
    verified: boolean;
    alreadyPaid: boolean;
    paidTotal: number;
    requiredTotal: number;
    breakdown: any;
}

const initialState: PaymentState = {
    loading: false,
    order: null,
    error: null,
    verified: false,
    alreadyPaid: false,
    paidTotal: 0,
    requiredTotal: 0,
    breakdown: null,
};`);

c = c.replace(
`        resetPaymentState: (state) => {
            state.alreadyPaid = false;
            state.order = null;
            state.error = null;
        },`,
`        resetPaymentState: (state) => {
            state.alreadyPaid = false;
            state.order = null;
            state.error = null;
            state.paidTotal = 0;
            state.requiredTotal = 0;
            state.breakdown = null;
        },
        setPaymentRequirement: (state, action) => {
            state.requiredTotal = action.payload.requiredTotal ?? 0;
            state.breakdown = action.payload.breakdown ?? null;
            state.alreadyPaid = action.payload.alreadyPaid ?? state.alreadyPaid;
            state.paidTotal = action.payload.paidTotal ?? state.paidTotal;
        },`);

c = c.replace(
`            .addCase(checkInvestorPaymentStatus.fulfilled, (state, action) => {
                state.loading = false;

                if (action.payload?.status === "success") {
                    state.verified = true;
                    state.alreadyPaid = true;
                } else {
                    state.alreadyPaid = false;
                }
            })`,
`            .addCase(checkInvestorPaymentStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.paidTotal = Number(action.payload?.paidTotal ?? 0);
                if (action.payload?.status === "success") {
                    state.verified = true;
                }
            })`);

c = c.replace(
`export const { resetPaymentState } = paymentSlice.actions;`,
`export const { resetPaymentState, setPaymentRequirement } = paymentSlice.actions;`);

fs.writeFileSync(file, c);
console.log("OK paymentSlice");
