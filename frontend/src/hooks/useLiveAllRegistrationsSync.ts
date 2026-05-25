import { useEffect, useMemo, useRef } from "react";
import {
  getLiveSocket,
  joinEventRoom,
  leaveEventRoom,
} from "../live/socket";
import {
  LIVE_EVENTS,
  type CheckInUpdatedPayload,
} from "../live/liveEvents";

type RowWithEvent = {
  id: string;
  eventId?: string;
};

type Options = {
  rows: RowWithEvent[];
  enabled?: boolean;
  onCheckIn?: (registrationId: string) => void;
};

export function useLiveAllRegistrationsSync({
  rows,
  enabled = true,
  onCheckIn,
}: Options) {
  const joinedEventIdsRef = useRef<Set<string>>(new Set());
  const onCheckInRef = useRef(onCheckIn);
  const rowsRef = useRef(rows);

  onCheckInRef.current = onCheckIn;
  rowsRef.current = rows;

  const visibleEventIdsKey = useMemo(() => {
    const ids = [
      ...new Set(
        rows
          .map((row) => row.eventId)
          .filter(Boolean)
          .map(String)
      ),
    ].sort();
    return ids.join(",");
  }, [rows]);

  useEffect(() => {
    if (!enabled) return;

    const visibleEventIds = new Set(
      visibleEventIdsKey ? visibleEventIdsKey.split(",") : []
    );
    const previouslyJoined = joinedEventIdsRef.current;

    for (const eventId of visibleEventIds) {
      if (!previouslyJoined.has(eventId)) {
        joinEventRoom(eventId);
      }
    }

    for (const eventId of previouslyJoined) {
      if (!visibleEventIds.has(eventId)) {
        leaveEventRoom(eventId);
      }
    }

    joinedEventIdsRef.current = visibleEventIds;
  }, [enabled, visibleEventIdsKey]);

  useEffect(() => {
    if (!enabled) return;

    const socket = getLiveSocket();

    const handleCheckIn = (payload: CheckInUpdatedPayload) => {
      const registrationId = String(payload.registrationId);
      const matched = rowsRef.current.some(
        (row) => String(row.id) === registrationId
      );
      if (matched) {
        onCheckInRef.current?.(registrationId);
      }
    };

    socket.on(LIVE_EVENTS.CHECKIN_UPDATED, handleCheckIn);

    return () => {
      socket.off(LIVE_EVENTS.CHECKIN_UPDATED, handleCheckIn);
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      for (const eventId of joinedEventIdsRef.current) {
        leaveEventRoom(eventId);
      }
      joinedEventIdsRef.current = new Set();
    };
  }, []);
}
