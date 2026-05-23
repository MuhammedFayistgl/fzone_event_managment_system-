import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  closeEventRegistration,
  createEvent,
  deleteEvent,
  fetchCreatedEvents,
  GetOneEventById,
  updateEvent
} from "./EventThunks";
import type { EventDay } from "../Types/event";

// ================= TYPES =================

interface EventForm {
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  registrationStart: string | null;
  registrationDeadline: string | null;
  maxParticipants: number;
  maxPerUser: number;
  isPaid: boolean;
  price: number;
  isRefundable: boolean;
  allowGuests: boolean;
  locationType: "online" | "offline";
  location: string;
  eventDays: EventDay[];
}

interface EventType {
  _id: string;
  title: string;
  description: string;
  locationType: "online" | "offline";
  location: string;
  isPaid: boolean;
  price: number;
  eventDays?: any[];
  registrationStart?: string;
  registrationDeadline?: string;
  isRefundable?: boolean;
  allowGuests?: boolean;
  maxPerUser?: number;
  maxParticipants?: number;
}

interface EventState {
  form: EventForm;
  events: EventType[];
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;

  // ✅ NEW
  editEventId: string | null;
  singleEvent: EventType | null;
}

// ================= INITIAL STATE =================

const initialState: EventState = {
  form: {
    title: "",
    description: "",
    startDate: null,
    endDate: null,
    registrationStart: null,
    registrationDeadline: null,
    maxParticipants: 0,
    maxPerUser: 1,
    isPaid: false,
    price: 0,
    isRefundable: false,
    allowGuests: false,
    locationType: "online",
    location: "",
    eventDays: []
  },
  events: [],
  loading: false,
  error: null,
  fieldErrors: {},

  // ✅ NEW
  editEventId: null,
  singleEvent: null,
  
};

// ================= SLICE =================

const slice = createSlice({
  name: "event",
  initialState,

  reducers: {
    updateField: (
      state,
      action: PayloadAction<{ key: string; value: any }>
    ) => {
      (state.form as any)[action.payload.key] = action.payload.value;
    },

    // ✅ SET FULL FORM (EDIT)
    setFormData: (state, action: PayloadAction<any>) => {
      state.form = { ...state.form, ...action.payload };
    },

    // ✅ SET EDIT MODE
    setEditEventId: (state, action: PayloadAction<string | null>) => {
      state.editEventId = action.payload;
    },

    // ✅ RESET FORM
    resetForm: (state) => {
      state.form = initialState.form;
      state.editEventId = null;
    }
  },

  extraReducers: (builder) => {
    builder



      // ================= CREATE =================


      .addCase(createEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(createEvent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createEvent.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Create failed";
        state.fieldErrors = action.payload?.errors || {};
      })




      // ================= FETCH =================


      .addCase(fetchCreatedEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCreatedEvents.fulfilled, (state, action: any) => {
        state.loading = false;
        state.events = action.payload?.data || action.payload || [];
      })
      .addCase(fetchCreatedEvents.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Fetch failed";
      })






      // ======= One event Get ===========


      .addCase(GetOneEventById.pending, (state) => {
        state.loading = true;
      })
      .addCase(GetOneEventById.fulfilled, (state, action: any) => {
        state.loading = false;

        state.singleEvent =
          action.payload?.data || null;
      })
      .addCase(GetOneEventById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Fetch failed";
      })








      // ================= DELETE =================





      .addCase(deleteEvent.fulfilled, (state, action) => {
        const deletedId = action.meta.arg as string;

        state.events = state.events.filter(
          (e) => e._id !== deletedId
        );
      })



      // ================= updateField =================

      // inside extraReducers

      // ================= UPDATE =================



      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action: any) => {
        state.loading = false;

        const updated = action.payload?.data;

        if (!updated) return;

        // ✅ replace updated event in list
        state.events = state.events.map((e) =>
          e._id === updated._id ? updated : e
        );
      })
      .addCase(updateEvent.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Update failed";
      })







    builder
      .addCase(closeEventRegistration.pending, (state) => {
        state.loading = true;
      })
      .addCase(closeEventRegistration.fulfilled, (state, action) => {
        state.loading = false;

        const updatedEvent =
          action.payload?.data || action.payload?.event;

        if (!updatedEvent) return;

        state.events = state.events.map((event: any) =>
          event._id === updatedEvent._id ? updatedEvent : event
        );
      })
      .addCase(closeEventRegistration.rejected, (state) => {
        state.loading = false;
      })

      ;
  }
})



// ================= EXPORT =================

export const {
  updateField,
  setFormData,
  setEditEventId,
  resetForm
} = slice.actions;

export default slice.reducer;