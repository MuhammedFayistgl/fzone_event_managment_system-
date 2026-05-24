import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  closeEventRegistration,
  createEvent,
  deleteEvent,
  fetchCreatedEvents,
  GetOneEventById,
  updateEvent,
  uploadTicketBackground,
  deleteTicketBackground,
  updateTicketDesignMode,
} from "./EventThunks";
import type { EventDay, TicketDesign } from "../Types/event";
import { normalizeEventPricing } from "../utils/pricing";

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
  investorIsFree: boolean;
  investorPrice: number;
  guestPaymentEnabled: boolean;
  guestPrice: number;
  freeGuestCount: number;
  isRefundable: boolean;
  allowGuests: boolean;
  locationType: "online" | "offline";
  location: string;
  eventDays: EventDay[];
  ticketDesign: TicketDesign;
}

interface EventType {
  _id: string;
  title: string;
  description: string;
  locationType: "online" | "offline";
  location: string;
  isPaid: boolean;
  price: number;
  investorIsFree?: boolean;
  investorPrice?: number;
  guestPaymentEnabled?: boolean;
  guestPrice?: number;
  freeGuestCount?: number;
  eventDays?: any[];
  registrationStart?: string;
  registrationDeadline?: string;
  isRefundable?: boolean;
  allowGuests?: boolean;
  maxPerUser?: number;
  maxParticipants?: number;
  ticketDesign?: TicketDesign;
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
    investorIsFree: false,
    investorPrice: 0,
    guestPaymentEnabled: false,
    guestPrice: 0,
    freeGuestCount: 0,
    isRefundable: false,
    allowGuests: false,
    locationType: "online",
    location: "",
    eventDays: [],
    ticketDesign: { mode: "default", textTheme: "dark" },
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
      const payload = action.payload;
      const investorPrice = Number(payload.investorPrice ?? payload.price ?? 0);
      const investorIsFree = payload.investorIsFree ?? (payload.isPaid ? investorPrice <= 0 : true);
      state.form = {
        ...state.form,
        ...payload,
        investorPrice,
        investorIsFree,
        guestPaymentEnabled: Boolean(payload.guestPaymentEnabled),
        guestPrice: Number(payload.guestPrice ?? 0),
        freeGuestCount: Number(payload.freeGuestCount ?? 0),
        ticketDesign: payload.ticketDesign ?? {
          mode: "default",
          textTheme: "dark",
          backgroundUrl: null,
        },
      };
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
        state.error = null;
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
        const raw = action.payload?.data || action.payload || [];
        state.events = Array.isArray(raw)
          ? raw.map((event: any) => ({ ...event, ...normalizeEventPricing(event) }))
          : raw;
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

        const data = action.payload?.data || null;
        state.singleEvent = data
          ? { ...data, ...normalizeEventPricing(data) }
          : null;
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
        state.error = null;

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

      .addCase(uploadTicketBackground.fulfilled, (state, action: any) => {
        const td = action.payload?.data;
        if (td) state.form.ticketDesign = { ...state.form.ticketDesign, ...td };
      })
      .addCase(deleteTicketBackground.fulfilled, (state, action: any) => {
        const td = action.payload?.data;
        if (td) state.form.ticketDesign = { ...state.form.ticketDesign, ...td };
      })
      .addCase(updateTicketDesignMode.fulfilled, (state, action: any) => {
        const td = action.payload?.data;
        if (td) state.form.ticketDesign = { ...state.form.ticketDesign, ...td };
      });

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