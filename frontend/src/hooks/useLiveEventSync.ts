import { useEffect } from "react";
import { useAppDispatch } from "./hooks";
import { eventRegistrationDetils_Get_ById } from "../redux/Thunks/EventRegisrationDetilsThunk";
import {
  applyLiveCheckInToRow,
  applyLiveBlockToRow,
} from "../redux/Slice/EventRegistrationDatas";
import {
  getLiveSocket,
  joinEventRoom,
  leaveEventRoom,
} from "../live/socket";
import {
  LIVE_EVENTS,
  type CheckInUpdatedPayload,
  type RegistrationCreatedPayload,
  type RegistrationBlockedPayload,
} from "../live/liveEvents";

type Options = {
  eventId?: string;
  enabled?: boolean;
};

export function useLiveEventSync({ eventId, enabled = true }: Options) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || !eventId) return;

    const socket = getLiveSocket();
    joinEventRoom(eventId);

    const onCheckIn = (payload: CheckInUpdatedPayload) => {
      if (String(payload.eventId) !== String(eventId)) return;

      dispatch(
        applyLiveCheckInToRow({
          registrationId: payload.registrationId,
          passType: payload.passType,
          participantId: payload.participantId,
          participantIndex: payload.participantIndex,
          checkedInAt: payload.checkedInAt,
        })
      );
    };

    const onRegistrationCreated = (payload: RegistrationCreatedPayload) => {
      if (String(payload.eventId) !== String(eventId)) return;
      dispatch(eventRegistrationDetils_Get_ById(eventId));
    };

    const onBlocked = (payload: RegistrationBlockedPayload) => {
      if (String(payload.eventId) !== String(eventId)) return;

      dispatch(
        applyLiveBlockToRow({
          registrationId: payload.registrationId,
          target: payload.target,
          guestIndex: payload.guestIndex,
          participantId: payload.participantId,
          isBlocked: payload.isBlocked,
          blockedReason: payload.blockedReason,
        })
      );
    };

    socket.on(LIVE_EVENTS.CHECKIN_UPDATED, onCheckIn);
    socket.on(LIVE_EVENTS.REGISTRATION_CREATED, onRegistrationCreated);
    socket.on(LIVE_EVENTS.REGISTRATION_BLOCKED, onBlocked);

    return () => {
      socket.off(LIVE_EVENTS.CHECKIN_UPDATED, onCheckIn);
      socket.off(LIVE_EVENTS.REGISTRATION_CREATED, onRegistrationCreated);
      socket.off(LIVE_EVENTS.REGISTRATION_BLOCKED, onBlocked);
      leaveEventRoom(eventId);
    };
  }, [dispatch, enabled, eventId]);
}
