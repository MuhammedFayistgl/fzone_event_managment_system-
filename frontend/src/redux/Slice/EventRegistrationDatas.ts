import { createSlice } from "@reduxjs/toolkit";
import { eventRegistrationDetils_Get_ById } from "../Thunks/EventRegisrationDetilsThunk";

const initialState = {
    eventsRegistors: [],
    loading: false,
    error: null,

}

// ================= SLICE =================
const EventRegistrationDatas = createSlice({
    name: "events",
    initialState,
    reducers: {


    },

    extraReducers: (builder) => {
        builder
            .addCase(eventRegistrationDetils_Get_ById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(
                eventRegistrationDetils_Get_ById.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.eventsRegistors = action.payload;

                }
            )
            .addCase(eventRegistrationDetils_Get_ById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong";
            });
    },
});

export const { } = EventRegistrationDatas.actions;
export default EventRegistrationDatas.reducer;