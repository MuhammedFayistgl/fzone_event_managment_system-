import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { fetchPaymentLedger } from "../redux/Slice/paymentLedgerSlice";
import { getLiveSocket } from "../live/socket";
import { LIVE_EVENTS } from "../live/liveEvents";

export function useLivePaymentLedgerSync(enabled = true) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.paymentLedger.filters);

  useEffect(() => {
    if (!enabled) return;

    const socket = getLiveSocket();
    const refresh = () => {
      dispatch(fetchPaymentLedger(filters));
    };

    socket.on(LIVE_EVENTS.DASHBOARD_UPDATED, refresh);

    return () => {
      socket.off(LIVE_EVENTS.DASHBOARD_UPDATED, refresh);
    };
  }, [dispatch, enabled, filters]);
}
