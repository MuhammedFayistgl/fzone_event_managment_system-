import { createSlice } from "@reduxjs/toolkit";
import type { EventFormState, Guest } from "../Types/event";
import { checkInvestor, deleteRegisteredGuest, registerEvent } from "./Thunks/EventRegistorThunk";
import { checkRegistrationStatus } from "./EventThunks";


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
  },

  extraReducers: (builder) => {
    builder
    // delete One guste
      .addCase(
        deleteRegisteredGuest.fulfilled,
        (state, action: any) => {

          if (state.data) {

            state.data = {
              ...state.data,
              participants:
                action.payload.participants,
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
          state.data = action.payload;
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
} = eventRegistorSlice.actions;

export default eventRegistorSlice.reducer;