import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { eventRegistrationDetils_Get_ById } from "../Thunks/EventRegisrationDetilsThunk";
import type { LivePassType } from "../../live/liveEvents";
import type { RegistrationAttendanceRow } from "../../Types/registrationAttendance.types";

type RegistrationDetailsPayload = {
  success?: boolean;
  data?: {
    event?: unknown;
    statistics?: {
      totalRegistrations?: number;
      totalParticipants?: number;
      checkedInCount?: number;
      pendingCheckInCount?: number;
      successfulPayments?: number;
      failedPayments?: number;
      refundedPayments?: number;
      totalRevenue?: number;
      genderBreakdown?: unknown;
    };
    registrations?: RegistrationAttendanceRow[];
  };
};

type LiveCheckInRowPatch = {
  registrationId: string;
  passType: LivePassType;
  participantId?: string | null;
  participantIndex?: number | null;
  checkedInAt: string;
};

type LiveBlockRowPatch = {
  registrationId: string;
  target: LivePassType;
  guestIndex?: number | null;
  participantId?: string | null;
  isBlocked: boolean;
  blockedReason?: string;
};

interface EventRegistrationDataState {
  eventsRegistors: RegistrationDetailsPayload | unknown[];
  loading: boolean;
  error: string | null;
}

function isRegistrationPayload(
  payload: RegistrationDetailsPayload | unknown[] | null | undefined
): payload is RegistrationDetailsPayload {
  return Boolean(payload && !Array.isArray(payload) && "data" in payload);
}

function registrationHasCheckIn(row: RegistrationAttendanceRow) {
  if (row.isCheckedIn) return true;
  return (row.participants || []).some((p) => p.isCheckedIn);
}

function getPayload(state: EventRegistrationDataState): RegistrationDetailsPayload | null {
  return isRegistrationPayload(state.eventsRegistors) ? state.eventsRegistors : null;
}

const initialState: EventRegistrationDataState = {
  eventsRegistors: [],
  loading: false,
  error: null,
};

const EventRegistrationDatas = createSlice({
  name: "events",
  initialState,
  reducers: {
    applyLiveCheckInToRow: (state, action: PayloadAction<LiveCheckInRowPatch>) => {
      const payload = getPayload(state);
      if (!payload?.data?.registrations) return;

      const {
        registrationId,
        passType,
        participantId,
        participantIndex,
        checkedInAt,
      } = action.payload;

      const row = payload.data.registrations.find(
        (item) => String(item._id) === String(registrationId)
      );
      if (!row) return;

      const wasCheckedIn = registrationHasCheckIn(row);

      if (passType === "investor") {
        row.isCheckedIn = true;
        row.checkedInAt = checkedInAt;
      } else {
        const participants = row.participants || [];
        const index =
          participantIndex != null && participantIndex >= 0
            ? participantIndex
            : participants.findIndex(
                (p) => participantId && String(p._id) === String(participantId)
              );

        if (index >= 0 && participants[index]) {
          participants[index] = {
            ...participants[index],
            isCheckedIn: true,
            checkedInAt,
          };
          row.participants = participants;
        }
      }

      const isCheckedInNow = registrationHasCheckIn(row);
      const stats = payload.data.statistics;
      if (stats && !wasCheckedIn && isCheckedInNow) {
        stats.checkedInCount = (stats.checkedInCount ?? 0) + 1;
        stats.pendingCheckInCount = Math.max((stats.pendingCheckInCount ?? 0) - 1, 0);
      }
    },
    applyLiveBlockToRow: (state, action: PayloadAction<LiveBlockRowPatch>) => {
      const payload = getPayload(state);
      if (!payload?.data?.registrations) return;

      const { registrationId, target, guestIndex, participantId, isBlocked, blockedReason } =
        action.payload;

      const row = payload.data.registrations.find(
        (item) => String(item._id) === String(registrationId)
      );
      if (!row) return;

      const now = isBlocked ? new Date().toISOString() : null;

      if (target === "investor") {
        row.isBlocked = isBlocked;
        row.blockedAt = now;
        row.blockedReason = isBlocked ? blockedReason || "" : "";
        return;
      }

      const participants = row.participants || [];
      const index =
        guestIndex != null && guestIndex >= 0
          ? guestIndex
          : participants.findIndex(
              (p) => participantId && String(p._id) === String(participantId)
            );

      if (index >= 0 && participants[index]) {
        participants[index] = {
          ...participants[index],
          isBlocked,
          blockedAt: now,
          blockedReason: isBlocked ? blockedReason || "" : "",
        };
        row.participants = participants;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(eventRegistrationDetils_Get_ById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(eventRegistrationDetils_Get_ById.fulfilled, (state, action) => {
        state.loading = false;
        state.eventsRegistors = action.payload;
      })
      .addCase(eventRegistrationDetils_Get_ById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Something went wrong";
      });
  },
});

export const { applyLiveCheckInToRow, applyLiveBlockToRow } = EventRegistrationDatas.actions;

export default EventRegistrationDatas.reducer;
