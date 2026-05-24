import { createAsyncThunk } from "@reduxjs/toolkit";

import API from "../../api/axios";
import type { DashboardEventsPayload } from "../../Types/eventExtendedTypes";

export const fetchRunningEvents = createAsyncThunk(
    "event/fetchRunningFull",
    async (_, { rejectWithValue }) => {
        try {
            const res = await API.get("/admin/getRunningEventsWithRegistrations");
            const payload: DashboardEventsPayload = {
                counts: res.data.counts ?? {
                    upcoming: 0,
                    running: 0,
                    past: 0,
                },
                data: res.data.data ?? {
                    upcoming: [],
                    running: [],
                    past: [],
                },
            };
            return payload;
        } catch (err: any) {
            return rejectWithValue(
                err?.response?.data?.message || "Fetch failed"
            );
        }
    }
);
