import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDashboardSummary } from "./ExtraSlice/InvestorExtraSlice";

type SummaryState = {
    totalInvestorsCount: number;
};

const initialState: SummaryState = {
    totalInvestorsCount: 0
};

const summarySlice = createSlice({
    name: "summary",
    initialState,
    reducers: {
        setSummary: (state, action: PayloadAction<number>) => {
            state.totalInvestorsCount = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getDashboardSummary.pending, (state) => {
                state.totalInvestorsCount = 0;
            })
            .addCase(getDashboardSummary.fulfilled, (state, action: PayloadAction<number>) => {
                state.totalInvestorsCount = action.payload;
            })
            .addCase(getDashboardSummary.rejected, (state) => {
                state.totalInvestorsCount = 0;
            });
    },
});

export const { setSummary } = summarySlice.actions;
export default summarySlice.reducer;