import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAppDispatch } from "./hooks";
import { applyLiveCheckIn, applyLiveBlock } from "../redux/EventRegister";
import {
  getLiveSocket,
  joinPassRoom,
  leavePassRoom,
} from "../live/socket";
import {
  LIVE_EVENTS,
  type CheckInUpdatedPayload,
  type RegistrationBlockedPayload,
} from "../live/liveEvents";
import { getPassSessionToken } from "../utils/authRole";

type Options = {
  eventId?: string;
  phone?: string;
  passSessionToken?: string;
  enabled?: boolean;
};

export function useLivePassSync({
  eventId,
  phone,
  passSessionToken,
  enabled = true,
}: Options) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || !eventId || !phone) return;

    const token =
      passSessionToken || getPassSessionToken(eventId, phone);
    if (!token) return;

    const socket = getLiveSocket();
    joinPassRoom(eventId, phone, token);

    const onCheckIn = (payload: CheckInUpdatedPayload) => {
      if (String(payload.eventId) !== String(eventId)) return;

      dispatch(
        applyLiveCheckIn({
          passType: payload.passType,
          participantId: payload.participantId,
          participantIndex: payload.participantIndex,
          checkedInAt: payload.checkedInAt,
        })
      );

      toast.success("Entry confirmed — pass used", { id: "live-checkin" });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    };

    const onBlocked = (payload: RegistrationBlockedPayload) => {
      if (String(payload.eventId) !== String(eventId)) return;

      dispatch(
        applyLiveBlock({
          target: payload.target,
          guestIndex: payload.guestIndex,
          participantId: payload.participantId,
          isBlocked: payload.isBlocked,
          blockedReason: payload.blockedReason,
        })
      );
    };

    socket.on(LIVE_EVENTS.CHECKIN_UPDATED, onCheckIn);
    socket.on(LIVE_EVENTS.REGISTRATION_BLOCKED, onBlocked);

    return () => {
      socket.off(LIVE_EVENTS.CHECKIN_UPDATED, onCheckIn);
      socket.off(LIVE_EVENTS.REGISTRATION_BLOCKED, onBlocked);
      leavePassRoom(eventId, phone);
    };
  }, [dispatch, enabled, eventId, phone, passSessionToken]);
}
