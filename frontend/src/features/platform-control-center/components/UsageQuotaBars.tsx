import type { PlatformOverview } from "../api/platformOpsApi";
import { formatBytes, formatPercent } from "../utils/formatOps";

type Quota = { label: string; used: number; limit: number };

export function UsageQuotaBars({ data }: { data?: PlatformOverview }) {
  const quotas: Quota[] = [
    {
      label: "Storage",
      used: data?.usage.storageUsedBytes || 0,
      limit: data?.usage.storageLimitBytes || 0,
    },
    {
      label: "API requests (month)",
      used: data?.usage.apiRequestsMonth || 0,
      limit: data?.usage.apiRequestsLimitMonth || 0,
    },
    {
      label: "Bandwidth (month)",
      used: data?.usage.bandwidthBytesMonth || 0,
      limit: data?.usage.bandwidthLimitBytes || 0,
    },
    {
      label: "Admin seats",
      used: data?.usage.adminCount || 0,
      limit: data?.usage.adminLimit || 0,
    },
  ];

  return (
    <div className="pcc-quota-panel app-card">
      <h3 className="pcc-panel-title">Plan usage & remaining quota</h3>
      <div className="pcc-quota-list">
        {quotas.map((q) => {
          const pct = formatPercent(q.used, q.limit);
          const tone = pct >= 90 ? "danger" : pct >= 75 ? "warn" : "ok";
          return (
            <div key={q.label} className="pcc-quota-row">
              <div className="pcc-quota-row__head">
                <span>{q.label}</span>
                <span>
                  {q.label.includes("seats")
                    ? `${q.used} / ${q.limit}`
                    : `${formatBytes(q.used)} / ${formatBytes(q.limit)}`}
                </span>
              </div>
              <div className="pcc-quota-track">
                <div
                  className={`pcc-quota-fill pcc-quota-fill--${tone}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="pcc-quota-remaining">{100 - pct}% remaining free quota</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
