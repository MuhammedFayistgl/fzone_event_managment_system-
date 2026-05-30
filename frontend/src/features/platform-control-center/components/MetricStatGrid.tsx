import { Cpu, Database, HardDrive, Users, Wifi, Zap } from "lucide-react";
import type { PlatformOverview } from "../api/platformOpsApi";
import { formatBytes } from "../utils/formatOps";

type Stat = { label: string; value: string; hint?: string; icon: typeof Cpu };

export function MetricStatGrid({ data }: { data?: PlatformOverview }) {
  const stats: Stat[] = [
    {
      label: "RAM usage",
      value: `${data?.system.memoryUsedPercent ?? 0}%`,
      hint: `${formatBytes(data?.system.memoryUsedBytes || 0)} / ${formatBytes(data?.system.memoryTotalBytes || 0)}`,
      icon: Cpu,
    },
    {
      label: "CPU load (1m)",
      value: (data?.system.cpuLoad1 ?? 0).toFixed(2),
      hint: `5m ${(data?.system.cpuLoad5 ?? 0).toFixed(2)} · 15m ${(data?.system.cpuLoad15 ?? 0).toFixed(2)}`,
      icon: Zap,
    },
    {
      label: "MongoDB storage",
      value: formatBytes(data?.mongo.storageSizeBytes || 0),
      hint: `${data?.mongo.collections ?? 0} collections`,
      icon: Database,
    },
    {
      label: "API requests (month)",
      value: (data?.usage.apiRequestsMonth ?? 0).toLocaleString(),
      hint: `${(data?.usage.apiRequestsToday ?? 0).toLocaleString()} today`,
      icon: Wifi,
    },
    {
      label: "Storage used",
      value: formatBytes(data?.usage.storageUsedBytes || 0),
      hint: `Limit ${formatBytes(data?.usage.storageLimitBytes || 0)}`,
      icon: HardDrive,
    },
    {
      label: "Active investors",
      value: String(data?.connections.activeInvestors ?? 0),
      hint: `${data?.usage.adminCount ?? 0} admins`,
      icon: Users,
    },
  ];

  return (
    <div className="pcc-stat-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="pcc-stat-card">
          <stat.icon size={18} className="pcc-stat-card__icon" />
          <p className="pcc-stat-card__label">{stat.label}</p>
          <p className="pcc-stat-card__value">{stat.value}</p>
          {stat.hint && <p className="pcc-stat-card__hint">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}
