import {
    createSlice
} from "@reduxjs/toolkit";
import { verifyQrCode } from "../Thunks/qrScannerThunk";



interface ScannerState {

    loading: boolean;

    success: boolean;

    error: string;

    currentScan: any;

}

const initialState: ScannerState = {

    loading: false,

    success: false,

    error: "",

    currentScan: null,

};

const qrScannerSlice =
    createSlice({

        name: "scanner",

        initialState,

        reducers: {

            resetScannerState:
                (state) => {

                    state.loading = false;

                    state.success = false;

                    state.error = "";

                    state.currentScan = null;

                },

        },

        extraReducers: (builder) => {

            builder

                // ================= PENDING =================

                .addCase(
                    verifyQrCode.pending,
                    (state) => {

                        state.loading = true;

                        state.error = "";

                        state.success = false;

                    }
                )

                // ================= SUCCESS =================

                .addCase(
                    verifyQrCode.fulfilled,
                    (state, action: any) => {

                        state.loading = false;

                        state.success = true;

                        state.currentScan =
                            action.payload.data;

                    }
                )

                // ================= ERROR =================

                .addCase(
                    verifyQrCode.rejected,
                    (state, action: any) => {

                        state.loading = false;

                        state.success = false;

                        state.error =
                            action.payload?.message ||
                            "Verification failed";

                    }
                );

        },

    });

export const {
    resetScannerState
} = qrScannerSlice.actions;

export default qrScannerSlice.reducer;