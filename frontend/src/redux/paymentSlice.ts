import { createSlice } from "@reduxjs/toolkit";
import { checkInvestorPaymentStatus, createPaymentOrder, verifyPayment } from "./EventThunks";


interface PaymentState {
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
}
const paymentSlice = createSlice({
    name: "payment",
    initialState,
    reducers: {
        resetPaymentState: (state) => {
            state.alreadyPaid = false;
            state.order = null;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(createPaymentOrder.pending, (state) => {
                state.loading = true;
            })
            .addCase(createPaymentOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.order = action.payload.order;
            })
            .addCase(createPaymentOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.alreadyPaid = (action.payload as any)?.message === "Already paid" ? true : false
            })

            .addCase(verifyPayment.pending, (state) => {
                state.loading = true;
            })
            .addCase(verifyPayment.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(checkInvestorPaymentStatus.fulfilled, (state, action) => {
                state.loading = false;

                if (action.payload?.status === "success") {
                    state.verified = true;
                    state.alreadyPaid = true;
                } else {
                    state.alreadyPaid = false;
                }
            })
    },
});

export const { resetPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;