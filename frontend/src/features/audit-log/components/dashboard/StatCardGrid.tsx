import {
  Activity,
  Download,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AuditLogSummary } from "../../types/auditLog.types";
import { StatCard } from "./StatCard";

type Props = {
  summary?: AuditLogSummary;
  loading?: boolean;
};

export function StatCardGrid({ summary, loading }: Props) {
  const cards = [
    { title: "Total Actions", metric: summary?.totalActions, icon: Activity, variant: "registrations" as const },
    { title: "Refunds", metric: summary?.refunds, icon: RotateCcw, variant: "pending" as const },
    { title: "Blocks", metric: summary?.blocks, icon: ShieldAlert, variant: "checkins" as const },
    { title: "Exports", metric: summary?.exports, icon: Download, variant: "revenue" as const },
    { title: "Payment Actions", metric: summary?.payments, icon: ShieldCheck, variant: "passes" as const },
    { title: "Settings", metric: summary?.settings, icon: Settings, variant: "database" as const },
    { title: "Last 24 Hours", metric: summary?.last24h, icon: RefreshCw, variant: "registrations" as const },
    { title: "Unique Actors", metric: summary?.uniqueActors, icon: Users, variant: "checkins" as const },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.title}
          title={card.title}
          metric={card.metric}
          icon={card.icon}
          variant={card.variant}
          loading={loading}
          index={index}
        />
      ))}
    </div>
  );
}
