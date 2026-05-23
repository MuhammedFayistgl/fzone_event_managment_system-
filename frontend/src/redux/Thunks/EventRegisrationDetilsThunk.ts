import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

const normalizeEventId = (payload: string | { id?: string } | undefined) => {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && payload.id) {
    return String(payload.id);
  }
  return undefined;
};

export const eventRegistrationDetils_Get_ById = createAsyncThunk(
  "eventRegistrationDetils_Get_ById",
  async (payload: string | { id?: string }, { rejectWithValue }) => {
    try {
      const id = normalizeEventId(payload);

      if (!id) {
        return rejectWithValue("Event ID is required");
      }

      const res = await API.post("/admin/RegistrationDetils", { id });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Data not font ! "
      );
    }
  }
);
