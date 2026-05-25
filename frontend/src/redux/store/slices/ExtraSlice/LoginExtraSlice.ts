import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../../api/axios";
import { getApiErrorMessage } from "../../../../utils/apiError";

export const SignupAdmin = createAsyncThunk(
  "admin/signup",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await API.post("/admin/signup", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, "Signup failed"));
    }
  }
);

export const LoginAdmin = createAsyncThunk(
  "admin/login",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await API.post("/admin/login", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, "Login failed"));
    }
  }
);
