import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import { fetchRunningEvents } from "./Thunks/RunningEventThunk";
import type { DashboardEventsPayload, RunningEventType } from "../Types/eventExtendedTypes";

interface EventState {
    upcoming: RunningEventType[];
    running: RunningEventType[];
    past: RunningEventType[];
    counts: DashboardEventsPayload["counts"];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const emptyCounts = { upcoming: 0, running: 0, past: 0 };

const initialState: EventState = {
    upcoming: [],
    running: [],
    past: [],
    counts: emptyCounts,
    loading: false,
    error: null,
    lastFetched: null,
};

const RunningEventsSlice = createSlice({
    name: "events",
    initialState,
    reducers: {
        clearEvents: (state) => {
            state.upcoming = [];
            state.running = [];
            state.past = [];
            state.counts = emptyCounts;
            state.lastFetched = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRunningEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                fetchRunningEvents.fulfilled,
                (state, action: PayloadAction<DashboardEventsPayload>) => {
                    state.loading = false;
                    state.upcoming = action.payload.data.upcoming;
                    state.running = action.payload.data.running;
                    state.past = action.payload.data.past;
                    state.counts = action.payload.counts;
                    state.lastFetched = Date.now();
                }
            )
            .addCase(fetchRunningEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || "Something went wrong";
            });
    },
});

export const { clearEvents } = RunningEventsSlice.actions;
export default RunningEventsSlice.reducer;
