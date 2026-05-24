export function formatDayDate(date: string | null | undefined): string {
  if (!date) return "Date TBD";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Date TBD";
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDayTime(time: string | null | undefined): string {
  if (!time) return "—";
  if (/^\d{2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(":").map(Number);
    const ref = new Date();
    ref.setHours(h, m, 0, 0);
    return ref.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatRegWindow(start?: string, end?: string): string {
  const fmt = (v?: string) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? null
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s} → ${e}`;
  if (s) return `From ${s}`;
  if (e) return `Until ${e}`;
  return "Open";
}
