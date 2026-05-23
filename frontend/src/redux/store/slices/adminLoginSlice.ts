import { createSlice } from "@reduxjs/toolkit";
import { LoginAdmin, SignupAdmin } from "./ExtraSlice/LoginExtraSlice";

interface AdminState {
    loading: boolean;
    accessToken: string | null;
    role: string | null;
    error: any;
}

const initialState: AdminState = {
    loading: false,
    accessToken: null,
    role: null,
    error: null
};

const AdminSlice = createSlice({
    name: "admin",
    initialState,
    
    reducers: {
    setAccessToken: (state, action) => {
        state.accessToken = action.payload;
        state.role = "admin"; // or decode JWT
    }
},
    extraReducers: (builder) => {
        builder

            // ✅ LOGIN
            .addCase(LoginAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(LoginAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.accessToken = action.payload.accessToken;
                state.role = action.payload.role;
            })
            .addCase(LoginAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ✅ SIGNUP
            .addCase(SignupAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(SignupAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.accessToken = action.payload.accessToken;
                state.role = action.payload.role;
            })
            .addCase(SignupAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});
export const {setAccessToken} = AdminSlice.actions;

export default AdminSlice.reducer;