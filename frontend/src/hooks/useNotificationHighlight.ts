import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useNotificationHighlightParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight")?.trim() || "";

  const clearHighlight = () => {
    if (!highlightId) return;
    const next = new URLSearchParams(searchParams);
    next.delete("highlight");
    setSearchParams(next, { replace: true });
  };

  return { highlightId, clearHighlight };
}

export function useScrollToHighlight(
  highlightId: string,
  selector: (id: string) => string,
  enabled = true
) {
  useEffect(() => {
    if (!enabled || !highlightId) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(selector(highlightId));
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("notif-row-highlight");
        window.setTimeout(() => el.classList.remove("notif-row-highlight"), 2500);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [enabled, highlightId, selector]);
}

export function matchesHighlight(
  highlightId: string,
  row: {
    _id?: string | null;
    id?: string | null;
    razorpay_payment_id?: string | null;
    razorpay_order_id?: string | null;
    phone?: string | null;
  }
) {
  if (!highlightId) return false;
  const ids = [
    row._id,
    row.id,
    row.razorpay_payment_id,
    row.razorpay_order_id,
    row.phone,
  ].filter(Boolean);
  return ids.some((v) => String(v) === highlightId || String(v).includes(highlightId));
}

export function useHighlightMatcher(highlightId: string) {
  return useMemo(
    () =>
      (row: {
        _id?: string | null;
        id?: string | null;
        razorpay_payment_id?: string | null;
        razorpay_order_id?: string | null;
        phone?: string | null;
      }) => matchesHighlight(highlightId, row),
    [highlightId]
  );
}
