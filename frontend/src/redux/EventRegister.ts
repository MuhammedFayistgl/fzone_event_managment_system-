import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EventFormState, Guest } from "../Types/event";
import { checkInvestor, deleteRegisteredGuest, registerEvent } from "./Thunks/EventRegistorThunk";
import { checkRegistrationStatus } from "./EventThunks";
import type { LivePassType } from "../live/liveEvents";
import { storePassSessionToken } from "../utils/authRole";

type LiveCheckInPatch = {
  passType: LivePassType;
  participantId?: string | null;
  participantIndex?: number | null;
  checkedInAt: string;
};

type LiveBlockPatch = {
  target: LivePassType;
  guestIndex?: number | null;
  participantId?: string | null;
  isBlocked: boolean;
  blockedReason?: string;
};


interface EventState {
  form: EventFormState;
  loading: boolean;

  // 🔹 INVESTOR
  data: any;
  investorLoading: boolean;
  investorError: string;

  // 🔹 REGISTRATION
  registrationLoading: boolean;
  registrationSuccess: boolean;
  registrationError: string;

  // 🔥 NEW: ALREADY REGISTERED
  alreadyRegistered: boolean;
  registrationCheckLoading: boolean;
  registrationCheckError: string;

  guests: Guest[];
  passSessionToken: string;

}

const initialState: EventState = {
  form: {} as EventFormState,
  loading: false,

  // DATAS
  data: null,
  investorLoading: false,
  investorError: "",

  // REGISTRATION
  registrationLoading: false,
  registrationSuccess: false,
  registrationError: "",

  // 🔥 NEW STATE
  alreadyRegistered: false,
  registrationCheckLoading: false,
  registrationCheckError: "",



  guests: [],
  passSessionToken: "",
};

const eventRegistorSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    addGuest: (state) => {
      state.guests.push({
        id: crypto.randomUUID(),
        name: "",
        relation: "wife",
        gender: "Female",
        phone: "",
      });
    },

    updateGuest: (
      state,
      action: {
        payload: {
          index: number;
          key: keyof Guest;
          value: any;
        };
      }
    ) => {
      const { index, key, value } = action.payload;

      if (state.guests[index]) {
        state.guests[index][key] = value;
      }
    },

    removeGuest: (state, action) => {
      state.guests = state.guests.filter(
        (_, i) => i !== action.payload
      );
    },

    resetGuests: (state) => {
      state.guests = [];
    },


    // 🔥 OPTIONAL RESET (safe add)
    resetRegistrationCheck: (state) => {
      state.alreadyRegistered = false;
      state.registrationCheckLoading = false;
      state.registrationCheckError = "";
    },
    clearInvestor: (state) => {
      state.data = null;
    },
    applyLiveCheckIn: (state, action: PayloadAction<LiveCheckInPatch>) => {
      const registration = state.data?.registration;
      if (!registration) return;

      const { passType, participantId, participantIndex, checkedInAt } = action.payload;

      if (passType === "investor") {
        registration.isCheckedIn = true;
        registration.checkedInAt = checkedInAt;
        return;
      }

      const participants = registration.participants || [];
      const index =
        participantIndex != null && participantIndex >= 0
          ? participantIndex
          : participants.findIndex(
              (p: { _id?: string }) =>
                participantId && String(p._id) === String(participantId)
            );

      if (index >= 0 && participants[index]) {
        participants[index] = {
          ...participants[index],
          isCheckedIn: true,
          checkedInAt,
        };
        registration.participants = participants;
      }
    },
    applyLiveBlock: (state, action: PayloadAction<LiveBlockPatch>) => {
      const registration = state.data?.registration;
      if (!registration) return;

      const { target, guestIndex, participantId, isBlocked, blockedReason } = action.payload;
      const now = isBlocked ? new Date().toISOString() : null;

      if (target === "investor") {
        registration.isBlocked = isBlocked;
        registration.blockedAt = now;
        registration.blockedReason = isBlocked ? blockedReason || "" : "";
        return;
      }

      const participants = registration.participants || [];
      const index =
        guestIndex != null && guestIndex >= 0
          ? guestIndex
          : participants.findIndex(
              (p: { _id?: string }) =>
                participantId && String(p._id) === String(participantId)
            );

      if (index >= 0 && participants[index]) {
        participants[index] = {
          ...participants[index],
          isBlocked,
          blockedAt: now,
          blockedReason: isBlocked ? blockedReason || "" : "",
        };
        registration.participants = participants;
      }
    },
  },

  extraReducers: (builder) => {
    builder
    // delete One guste
      .addCase(
        deleteRegisteredGuest.fulfilled,
        (state, action: any) => {
          if (state.data?.registration) {
            state.data = {
              ...state.data,
              registration: {
                ...state.data.registration,
                participants: action.payload.participants,
              },
            };
          }
        }
      )
      // ================= REGISTER EVENT =================
      .addCase(registerEvent.pending, (state) => {
        state.registrationLoading = true;
        state.registrationError = "";
      })

        .addCase(registerEvent.fulfilled, (state, action) => {
          state.registrationLoading = false;
          state.registrationSuccess = true;
          const registration = action.payload?.registration ?? state.data?.registration;
          const participants =
            action.payload?.participants ?? registration?.participants ?? [];
          state.passSessionToken = action.payload?.passSessionToken || "";
          if (state.passSessionToken && registration?.phone && action.payload?.eventId) {
            storePassSessionToken(
              String(action.payload.eventId),
              String(registration.phone),
              state.passSessionToken
            );
          }
          state.data = {
            ...(state.data || {}),
            success: true,
            registered: true,
            investor: action.payload?.investor ?? state.data?.investor,
            registration: registration
              ? { ...registration, participants }
              : { participants },
          };
          state.guests = [];
        })

        .addCase(registerEvent.rejected, (state, action: any) => {
          state.registrationLoading = false;
          state.registrationError = action.payload;
        })

        // ================= CHECK INVESTOR =================
        .addCase(checkInvestor.pending, (state) => {
          state.investorLoading = true;
          state.investorError = "";
        })

        .addCase(checkInvestor.fulfilled, (state, action) => {
          state.investorLoading = false;
          state.data = action.payload;
          if (action.payload?.passSessionToken) {
            state.passSessionToken = action.payload.passSessionToken;
            const eventId = action.meta?.arg?.eventId;
            const phone = action.meta?.arg?.phone;
            if (eventId && phone) {
              storePassSessionToken(String(eventId), String(phone), state.passSessionToken);
            }
          }
        })

        .addCase(checkInvestor.rejected, (state, action: any) => {
          state.investorLoading = false;
          state.data = null;
          state.investorError = action.payload;
        })

        // ================= 🔥 NEW: CHECK REGISTRATION =================
        .addCase(checkRegistrationStatus.pending, (state) => {
          state.registrationCheckLoading = true;
          state.registrationCheckError = "";
        })

        .addCase(checkRegistrationStatus.fulfilled, (state, action: any) => {
          state.registrationCheckLoading = false;
          state.alreadyRegistered = action.payload?.registered || false;
        })

        .addCase(checkRegistrationStatus.rejected, (state, action: any) => {
          state.registrationCheckLoading = false;
          state.registrationCheckError = action.payload;
        });
  },
});

export const {
  resetRegistrationCheck,
  clearInvestor,
  addGuest,
  updateGuest,
  removeGuest,
  resetGuests,
  applyLiveCheckIn,
  applyLiveBlock,
} = eventRegistorSlice.actions;

export default eventRegistorSlice.reducer;