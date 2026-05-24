import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../../api/axios";

// ✅ Signup
export const SignupAdmin = createAsyncThunk(
    "admin/signup",
    async (data: { email: string; password: string }) => {
        const res = await API.post(
            "/admin/signup",
            data
        );

        return res.data;
    }
);

// ✅ Login
export const LoginAdmin = createAsyncThunk(
    "admin/login",
    async (data: { email: string; password: string }) => {

        const res = await API.post(
            "/admin/login",
            data
        );

        return res.data;
    }
);