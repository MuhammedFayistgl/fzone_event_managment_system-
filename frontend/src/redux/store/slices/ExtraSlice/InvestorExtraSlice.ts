import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../../api/axios";


export const fetchInvestorData = createAsyncThunk(
  "getInvestorDetails",
  async ({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    gender,
  }: {
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    gender?: string;
  }) => {
    const response = await API.post("/admin/getInvestorDetails", {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      gender: gender || "",
    });

    return response.data;
  }
);

export const getDashboardSummary = createAsyncThunk(
  "getDashboardSummary",
  async () => {
    const response = await API.get("/admin/getDashboardSummary");
    return response.data;
  }
);

export const updateInvestorData = createAsyncThunk(
  "updateInvestor",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await API.put(`/admin/updateInvestor/${id}`, data);
    return res.data;
  }
);

export const deleteInvestorData = createAsyncThunk(
  "deleteInvestor",
  async (id: string) => {
    await API.delete(`/admin/deleteInvestor/${id}`);
    return id;
  }
);

export const createInvestorData = createAsyncThunk(
  "createInvestor",
  async (data: any) => {
    const res = await API.post("/admin/uploadInvestorDetails", data);
    return res.data;
  }
);
