const monthKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const dayKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

const counters = {
  apiToday: 0,
  apiMonth: 0,
  bandwidthToday: 0,
  bandwidthMonth: 0,
  currentDay: dayKey(),
  currentMonth: monthKey(),
};

function rollCountersIfNeeded() {
  const today = dayKey();
  const month = monthKey();
  if (counters.currentDay !== today) {
    counters.apiToday = 0;
    counters.bandwidthToday = 0;
    counters.currentDay = today;
  }
  if (counters.currentMonth !== month) {
    counters.apiMonth = 0;
    counters.bandwidthMonth = 0;
    counters.currentMonth = month;
  }
}

export function getApiUsageCounters() {
  rollCountersIfNeeded();
  return {
    apiRequestsToday: counters.apiToday,
    apiRequestsMonth: counters.apiMonth,
    bandwidthBytesToday: counters.bandwidthToday,
    bandwidthBytesMonth: counters.bandwidthMonth,
    periodMonth: counters.currentMonth,
    periodDay: counters.currentDay,
  };
}

export function apiUsageMiddleware() {
  return (req, res, next) => {
    rollCountersIfNeeded();
    counters.apiToday += 1;
    counters.apiMonth += 1;

    const originalEnd = res.end;
    res.end = function end(...args) {
      const lengthHeader = res.getHeader("content-length");
      const bytes =
        typeof lengthHeader === "string"
          ? Number(lengthHeader)
          : typeof lengthHeader === "number"
            ? lengthHeader
            : 0;
      if (Number.isFinite(bytes) && bytes > 0) {
        counters.bandwidthToday += bytes;
        counters.bandwidthMonth += bytes;
      }
      return originalEnd.apply(this, args);
    };

    next();
  };
}
