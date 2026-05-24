import { useEffect } from "react";
import { useAppDispatch } from "./hooks";
import { getDashboardSummary } from "../redux/store/slices/ExtraSlice/InvestorExtraSlice";
import { getLiveSocket } from "../live/socket";
import { LIVE_EVENTS } from "../live/liveEvents";

export function useLiveDashboardSync(enabled = true) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) return;

    const socket = getLiveSocket();

    const refresh = () => {
      dispatch(getDashboardSummary());
    };

    socket.on(LIVE_EVENTS.DASHBOARD_UPDATED, refresh);
    socket.on(LIVE_EVENTS.CHECKIN_UPDATED, refresh);
    socket.on(LIVE_EVENTS.REGISTRATION_CREATED, refresh);

    return () => {
      socket.off(LIVE_EVENTS.DASHBOARD_UPDATED, refresh);
      socket.off(LIVE_EVENTS.CHECKIN_UPDATED, refresh);
      socket.off(LIVE_EVENTS.REGISTRATION_CREATED, refresh);
    };
  }, [dispatch, enabled]);
}
