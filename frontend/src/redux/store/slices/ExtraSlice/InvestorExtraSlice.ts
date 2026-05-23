import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchInvestorData = createAsyncThunk(
    "getInvestorDetails",
    async ({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
    }: {
        page: number;
        limit: number;
        search: string;
        sortBy: string;
        sortOrder: "asc" | "desc";
    }) => {
        const response = await axios.post("http://localhost:3000/admin/getInvestorDetails", {
            page,
            limit,
            search,
            sortBy,
            sortOrder,
        });

        return response.data;
    }
);

export const getDashboardSummary = createAsyncThunk(
    'getDashboardSummary',
    async () => {
        const response = await axios.get("http://localhost:3000/admin/getDashboardSummary");
        return response.data;
    }
);

// UPDATE
export const updateInvestorData = createAsyncThunk(
    "updateInvestor",
    async ({ id, data }: { id: string; data: any }) => {
        const res = await axios.put(
            `http://localhost:3000/admin/updateInvestor/${id}`,
            data
        );
        return res.data;
    }
);

// DELETE
export const deleteInvestorData = createAsyncThunk(
    "deleteInvestor",
    async (id: string) => {
        await axios.delete(
            `http://localhost:3000/admin/deleteInvestor/${id}`
        );
        return id;
    }
);


export const createInvestorData = createAsyncThunk(
    "createInvestor",
    async (data: any) => {
        const res = await axios.post(
            "http://localhost:3000/admin/uploadInvestorDetails",
            data
        );
        return res.data;
    }
);