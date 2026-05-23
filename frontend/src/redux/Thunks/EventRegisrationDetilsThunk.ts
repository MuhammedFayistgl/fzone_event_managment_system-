import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const eventRegistrationDetils_Get_ById = createAsyncThunk(
    "eventRegistrationDetils_Get_ById",
    async (id: any, { rejectWithValue }) => {
        try {
            const res = await API.post("/admin/RegistrationDetils", { id :id });
            return res.data;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || "Data not font ! "
            );
        }
    }
);