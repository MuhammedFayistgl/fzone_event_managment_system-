import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";
import type { ScannerType } from "../../Types/scannerTypes";


export const verifyQrCode =
    createAsyncThunk(

        "scanner/verifyQrCode",

        async (
            data: ScannerType,
            { rejectWithValue }
        ) => {

            try {

                const res = await API.post(
                    "/admin/verify-qr",
                    data
                );

                return res.data;

            } catch (err: any) {

                return rejectWithValue(
                    err.response?.data ||
                    {
                        message:
                            "QR verification failed"
                    }
                );

            }

        }
    );