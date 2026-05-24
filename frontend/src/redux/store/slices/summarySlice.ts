import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDashboardSummary } from "./ExtraSlice/InvestorExtraSlice";

export type DashboardSummary = {
    totalInvestors: number;
    totalRegistrations: number;
    entryPassesIssued: number;
    investorPasses: number;
    guestPasses: number;
    verifiedCheckIns: number;
    pendingCheckIn: number;
    checkInRate: number;
    totalRevenue: number;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
    guestMaleCount: number;
    guestFemaleCount: number;
    guestOtherCount: number;
    mainMembers: number;
    subMembers: number;
};

const emptySummary: DashboardSummary = {
    totalInvestors: 0,
    totalRegistrations: 0,
    entryPassesIssued: 0,
    investorPasses: 0,
    guestPasses: 0,
    verifiedCheckIns: 0,
    pendingCheckIn: 0,
    checkInRate: 0,
    totalRevenue: 0,
    maleCount: 0,
    femaleCount: 0,
    otherCount: 0,
    guestMaleCount: 0,
    guestFemaleCount: 0,
    guestOtherCount: 0,
    mainMembers: 0,
    subMembers: 0,
};

type SummaryState = {
    totalInvestorsCount: DashboardSummary;
    loading: boolean;
    initialized: boolean;
    error: string | null;
};

const initialState: SummaryState = {
    totalInvestorsCount: emptySummary,
    loading: false,
    initialized: false,
    error: null,
};

const summarySlice = createSlice({
    name: "summary",
    initialState,
    reducers: {
        setSummary: (state, action: PayloadAction<DashboardSummary>) => {
            state.totalInvestorsCount = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getDashboardSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getDashboardSummary.fulfilled, (state, action: PayloadAction<DashboardSummary>) => {
                state.loading = false;
                state.initialized = true;
                state.totalInvestorsCount = {
                    ...emptySummary,
                    ...action.payload,
                };
            })
            .addCase(getDashboardSummary.rejected, (state) => {
                state.loading = false;
                state.error = "Failed to load dashboard summary";
            });
    },
});

export const { setSummary } = summarySlice.actions;
export default summarySlice.reducer;
