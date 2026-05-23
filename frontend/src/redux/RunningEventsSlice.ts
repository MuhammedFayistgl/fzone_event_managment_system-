import {
    createSlice,

    type PayloadAction,
} from "@reduxjs/toolkit";
import { fetchRunningEvents } from "./Thunks/RunningEventThunk";
import type { RunningEventType } from "../Types/eventExtendedTypes";



// ================= STATE =================
interface EventState {
    events: RunningEventType[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const initialState: EventState = {
    events: [],
    loading: false,
    error: null ,
    lastFetched: null,
};




// ================= SLICE =================
const RunningEventsSlice = createSlice({
    name: "events",
    initialState,
    reducers: {
        // optional manual reset
        clearEvents: (state) => {
            state.events = [];
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
                (state, action: PayloadAction<RunningEventType[]>) => { // ✅ FIX
                    state.loading = false;
                    state.events = action.payload;
                    state.lastFetched = Date.now();
                }
            )
            .addCase(fetchRunningEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong";
            });
    },
});

export const { clearEvents } = RunningEventsSlice.actions;
export default RunningEventsSlice.reducer;