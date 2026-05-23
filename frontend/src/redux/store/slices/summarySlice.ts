import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDashboardSummary } from "./ExtraSlice/InvestorExtraSlice";

export type DashboardSummary = {
    totalInvestors: number;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
    entryPassesIssued: number;
    verifiedCheckIns: number;
    mainMembers: number;
    subMembers: number;
};

const emptySummary: DashboardSummary = {
    totalInvestors: 0,
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    entryPassesIssued: 0,
    verifiedCheckIns: 0,
    mainMembers: 0,
    subMembers: 0,
};

type SummaryState = {
    totalInvestorsCount: DashboardSummary;
};

const initialState: SummaryState = {
    totalInvestorsCount: emptySummary,
};

const summarySlice = createSlice({
    name: "summary",
    initialState,
    reducers: {
        setSummary: (state, action: PayloadAction<DashboardSummary>) => {
            state.totalInvestorsCount = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getDashboardSummary.pending, (state) => {
                state.totalInvestorsCount = emptySummary;
            })
            .addCase(getDashboardSummary.fulfilled, (state, action: PayloadAction<DashboardSummary>) => {
                state.totalInvestorsCount = action.payload;
            })
            .addCase(getDashboardSummary.rejected, (state) => {
                state.totalInvestorsCount = emptySummary;
            });
    },
});

export const { setSummary } = summarySlice.actions;
export default summarySlice.reducer;