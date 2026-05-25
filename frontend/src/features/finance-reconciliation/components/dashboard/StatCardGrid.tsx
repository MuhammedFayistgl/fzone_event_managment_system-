import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Scale,
  XCircle,
} from "lucide-react";
import type { ReconciliationSummary } from "../../types/reconciliation.types";
import { StatCard } from "./StatCard";

type Props = {
  summary?: ReconciliationSummary;
  loading?: boolean;
};

export function StatCardGrid({ summary, loading }: Props) {
  const cards = [
    { title: "Total Transactions", metric: summary?.totalTransactions, icon: CreditCard, variant: "registrations" as const },
    { title: "Reconciled", metric: summary?.reconciled, icon: CheckCircle2, variant: "passes" as const },
    { title: "Pending", metric: summary?.pending, icon: Clock, variant: "pending" as const },
    { title: "Failed", metric: summary?.failed, icon: XCircle, variant: "checkins" as const },
    { title: "Revenue Processed", metric: summary?.revenueProcessed, icon: Banknote, format: "currency" as const, variant: "revenue" as const },
    { title: "Settlement Amount", metric: summary?.settlementAmount, icon: Scale, format: "currency" as const, variant: "registrations" as const },
    { title: "Disputed / Mismatch", metric: summary?.disputed, icon: AlertTriangle, variant: "pending" as const },
    { title: "Refunds", metric: summary?.refunds, icon: RefreshCw, format: "currency" as const, variant: "database" as const },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.title}
          title={card.title}
          metric={card.metric}
          icon={card.icon}
          format={card.format}
          variant={card.variant}
          loading={loading}
          index={index}
        />
      ))}
    </div>
  );
}
