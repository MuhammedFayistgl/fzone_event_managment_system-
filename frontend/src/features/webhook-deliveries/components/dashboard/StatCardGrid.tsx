import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  CreditCard,
  Inbox,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import type { WebhookSummary } from "../../types/webhook.types";
import { StatCard } from "./StatCard";

type Props = {
  summary?: WebhookSummary;
  loading?: boolean;
};

export function StatCardGrid({ summary, loading }: Props) {
  const cards = [
    { title: "Total Deliveries", metric: summary?.totalDeliveries, icon: Activity, variant: "registrations" as const },
    { title: "Processed", metric: summary?.processed, icon: CheckCircle2, variant: "passes" as const },
    { title: "Failed", metric: summary?.failed, icon: AlertTriangle, variant: "checkins" as const },
    { title: "Ignored", metric: summary?.ignored, icon: Ban, variant: "database" as const },
    { title: "Received", metric: summary?.received, icon: Inbox, variant: "pending" as const },
    { title: "Last 24 Hours", metric: summary?.last24h, icon: RefreshCw, variant: "registrations" as const },
    { title: "Payment Captured", metric: summary?.paymentCaptured, icon: CreditCard, variant: "revenue" as const },
    { title: "Refund Events", metric: summary?.refundEvents, icon: RotateCcw, variant: "pending" as const },
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
