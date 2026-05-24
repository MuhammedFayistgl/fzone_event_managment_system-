import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

export const createEvent = createAsyncThunk(
  "event/create",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await API.post("/admin/createvent", data);

      return res.data; // ✅ axios

    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Create event failed"
      );
    }
  }
);



// ✅ GET EVENT
export const fetchCreatedEvents = createAsyncThunk(
  "event/fetch",
  async (_id: string, { rejectWithValue }) => {
    try {
      const res = await API.get(`/admin/createdevents/`);

      return res.data;

    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch failed"
      );
    }
  }
);

// Fetch one event get by url ID 
export const GetOneEventById = createAsyncThunk(
  "GetOneEventById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await API.post(`/user/GetOneEventById/${id}`);

      return res.data;

    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Fetch failed"
      );
    }
  }
);


export const deleteEvent = createAsyncThunk(
  "event/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await API.delete(`/admin/eventDelete/${id}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message);
    }
  }
);


// redux/EventThunks.ts

export const updateEvent = createAsyncThunk(
  "event/update",
  async (
    { id, data }: { id: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.put(`/admin/eventedit/${id}`, data);

      return res.data;

    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data || {
          message: "Update failed"
        }
      );
    }
  }
);






// TYPES
type CreateOrderPayload = {
  eventId: string;
  phone: string;
  guestCount?: number;
};

export const createPaymentOrder = createAsyncThunk(
  "payment/createOrder",
  async (data: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const res = await API.post("/user/createPayment", data);
      return res.data;
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) return rejectWithValue(data);
      return rejectWithValue({ message: "Payment order failed" });
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "payment/verify",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await API.post("/user/createPaymentVerify", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Verification failed"
      );
    }
  }
);


export const checkInvestorPaymentStatus = createAsyncThunk(
  "payment/checkInvestorStatus",
  async (
    { eventId, phone }: { eventId: string; phone: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.post("/user/check-payment-status", {
        eventId,
        phone,
      });

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Status check failed"
      );
    }
  }
);

export const uploadTicketBackground = createAsyncThunk(
  "event/uploadTicketBackground",
  async (
    { eventId, file, textTheme }: { eventId: string; file: File; textTheme?: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("background", file);
      if (textTheme) formData.append("textTheme", textTheme);
      const res = await API.post(`/admin/events/${eventId}/ticket-background`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Upload failed");
    }
  }
);

export const deleteTicketBackground = createAsyncThunk(
  "event/deleteTicketBackground",
  async (eventId: string, { rejectWithValue }) => {
    try {
      const res = await API.delete(`/admin/events/${eventId}/ticket-background`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Delete failed");
    }
  }
);

export const updateTicketDesignMode = createAsyncThunk(
  "event/updateTicketDesignMode",
  async (
    { eventId, mode, textTheme }: { eventId: string; mode: string; textTheme?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.patch(`/admin/events/${eventId}/ticket-design`, {
        mode,
        textTheme,
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Update failed");
    }
  }
);

export const closeEventRegistration = createAsyncThunk(
  "event/closeRegistration",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await API.patch(`/admin/events/${id}/close-registration`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to close registration"
      );
    }
  }
);



export const checkRegistrationStatusAPI = async (data: {
  eventId: string;
  phone: string;
}) => {
  const res = await API.post("/user/check-registration", data);
  return res.data;
};



export const blockRegistrationParticipant = createAsyncThunk(
  "admin/blockRegistrationParticipant",
  async (
    data: {
      registrationId: string;
      target: "investor" | "guest";
      guestIndex?: number;
      blocked: boolean;
      reason?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await API.patch(
        `/admin/registrations/${data.registrationId}/block`,
        {
          target: data.target,
          guestIndex: data.guestIndex,
          blocked: data.blocked,
          reason: data.reason,
        }
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Block update failed"
      );
    }
  }
);

// CHECK REGISTRATION
export const checkRegistrationStatus = createAsyncThunk(
  "eventRegister/checkRegistrationStatus",
  async (
    data: { eventId: string; phone: string },
    thunkAPI
  ) => {
    try {
      const res = await checkRegistrationStatusAPI(data);
      return res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data || "Registration check failed"
      );
    }
  }
);