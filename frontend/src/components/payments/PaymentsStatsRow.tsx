import type { ElementType } from "react";
import { Wallet, BadgeCheck, XCircle, Clock, RotateCcw } from "lucide-react";
import { formatCurrency } from "../../utils/pricing";
import type { PaymentLedgerStatistics } from "../../Types/paymentLedger.types";

type StatItem = {
  label: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
  variant: "revenue" | "success" | "failed" | "pending" | "refunded";
};

type Props = {
  statistics: PaymentLedgerStatistics;
  loading?: boolean;
};

function StatSkeleton() {
  return <div className="overview-kpi-skeleton" />;
}

export default function PaymentsStatsRow({ statistics, loading }: Props) {
  const items: StatItem[] = [
    {
      label: "Total Revenue",
      value: formatCurrency(statistics.totalRevenue ?? 0),
      subtitle: "Successful payments collected",
      icon: Wallet,
      variant: "revenue",
    },
    {
      label: "Successful",
      value: statistics.successfulCount ?? 0,
      subtitle: "Completed transactions",
      icon: BadgeCheck,
      variant: "success",
    },
    {
      label: "Failed",
      value: statistics.failedCount ?? 0,
      subtitle: "Unsuccessful attempts",
      icon: XCircle,
      variant: "failed",
    },
    {
      label: "Pending",
      value: statistics.pendingCount ?? 0,
      subtitle: "Orders awaiting payment",
      icon: Clock,
      variant: "pending",
    },
    {
      label: "Refunded",
      value: formatCurrency(statistics.refundedAmount ?? 0),
      subtitle: `${statistics.refundedCount ?? 0} refund(s)`,
      icon: RotateCcw,
      variant: "refunded",
    },
  ];

  if (loading) {
    return (
      <div className="payments-stats-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="payments-stats-grid">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className={`overview-kpi-card overview-kpi-card--${item.variant === "success" ? "passes" : item.variant === "failed" ? "pending" : item.variant === "pending" ? "checkins" : item.variant === "refunded" ? "database" : "revenue"} pro-animate-in`}
            style={{ ["--pro-delay" as string]: `${index * 50}ms` }}
          >
            <span className="overview-kpi-card__glow" aria-hidden />
            <div className="overview-kpi-card__head">
              <p className="overview-kpi-card__label">{item.label}</p>
              <div className="overview-kpi-card__icon-wrap" aria-hidden>
                <Icon className="w-5 h-5" strokeWidth={2.25} />
              </div>
            </div>
            <h2 className="overview-kpi-card__value">{item.value}</h2>
            <p className="overview-kpi-card__subtitle mt-2">{item.subtitle}</p>
          </article>
        );
      })}
    </div>
  );
}
