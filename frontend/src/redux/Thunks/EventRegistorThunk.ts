import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const checkInvestor = createAsyncThunk(
  "check-investor",
  async ({ phone, eventId }: any, { rejectWithValue }) => {
    try {
      const res = await API.post("/user/checkInvestor", {
        phone, eventId
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response.data.message);
    }
  }
);

export const registerEvent = createAsyncThunk(
  "event/register",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await API.post("/user/createRegistration", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const deleteRegisteredGuest = createAsyncThunk(
  "event/deleteRegisteredGuest",

  async (
    data: {
      registrationId: string;
      guestIndex: number;
    },
    { rejectWithValue }
  ) => {

    try {

      const res = await API.post(
        "/user/delete-guest",
        data
      );

      return res.data;

    } catch (err: any) {

      return rejectWithValue(
        err.response?.data?.message ||
        "Guest delete failed"
      );

    }
  }
);