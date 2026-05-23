import { createAsyncThunk } from "@reduxjs/toolkit";

import API from "../../api/axios";


export const fetchRunningEvents = createAsyncThunk(
    "event/fetchRunningFull",

    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get("/admin/getRunningEventsWithRegistrations");

            return res.data.data; // ✅ important
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message || "Fetch failed"
            );
        }
    }
);



