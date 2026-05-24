import type { ElementType } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import {
  Users,
  Ticket,
  BadgeCheck,
  UserCheck,
  Wallet,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "../utils/pricing";
import type { DashboardSummary } from "../redux/store/slices/summarySlice";

type KpiVariant =
  | "registrations"
  | "passes"
  | "checkins"
  | "pending"
  | "revenue"
  | "database";

type KpiCard = {
  title: string;
  value: string | number;
  subtitle: string;
  to: string;
  icon: ElementType;
  variant: KpiVariant;
};

function formatKpiValue(value: string | number) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

function DashboardCardSkeleton() {
  return (
    <div className="overview-kpi-skeleton">
      <div className="h-3 w-28 rounded bg-app-surface-muted mb-6" />
      <div className="h-9 w-20 rounded bg-app-surface-muted mb-4" />
      <div className="h-3 w-36 rounded bg-app-surface-muted" />
    </div>
  );
}

function OverviewKpiCard({
  card,
  delay,
}: {
  card: KpiCard;
  delay: number;
}) {
  const Icon = card.icon;

  return (
    <Link to={card.to} className="overview-kpi-link pro-animate-in" style={{ ["--pro-delay" as string]: `${delay}ms` }}>
      <article className={`overview-kpi-card overview-kpi-card--${card.variant}`}>
        <span className="overview-kpi-card__glow" aria-hidden />

        <div className="overview-kpi-card__head">
          <p className="overview-kpi-card__label">{card.title}</p>
          <div className="overview-kpi-card__icon-wrap" aria-hidden>
            <Icon className="w-5 h-5" strokeWidth={2.25} />
          </div>
        </div>

        <h2 className="overview-kpi-card__value">{formatKpiValue(card.value)}</h2>

        <div className="overview-kpi-card__foot">
          <p className="overview-kpi-card__subtitle">{card.subtitle}</p>
          <span className="overview-kpi-card__cta">
            Open
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
        </div>
      </article>
    </Link>
  );
}

const DashboardCards = () => {
  const summary = useSelector(
    (state: {
      summary: {
        totalInvestorsCount: DashboardSummary;
        loading: boolean;
        initialized: boolean;
      };
    }) => state.summary.totalInvestorsCount
  );
  const loading = useSelector(
    (state: { summary: { loading: boolean; initialized: boolean } }) => state.summary.loading
  );
  const initialized = useSelector(
    (state: { summary: { initialized: boolean } }) => state.summary.initialized
  );

  const showSkeleton = loading && !initialized;

  const cards: KpiCard[] = [
    {
      title: "Total Registrations",
      value: summary.totalRegistrations ?? 0,
      subtitle: "Investor event registrations",
      to: "/allregistrations",
      icon: Users,
      variant: "registrations",
    },
    {
      title: "Entry Passes Issued",
      value: summary.entryPassesIssued ?? 0,
      subtitle: `${summary.investorPasses ?? 0} investor + ${summary.guestPasses ?? 0} guest passes`,
      to: "/attendance-logs",
      icon: Ticket,
      variant: "passes",
    },
    {
      title: "Verified Check-ins",
      value: summary.verifiedCheckIns ?? 0,
      subtitle: `${summary.checkInRate ?? 0}% check-in rate`,
      to: "/attendance-logs",
      icon: BadgeCheck,
      variant: "checkins",
    },
    {
      title: "Pending Entry",
      value: summary.pendingCheckIn ?? 0,
      subtitle: "Passes not yet scanned",
      to: "/gate-scanner",
      icon: UserCheck,
      variant: "pending",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue ?? 0),
      subtitle: "Successful payments",
      to: "/payments",
      icon: Wallet,
      variant: "revenue",
    },
    {
      title: "Participant Database",
      value: summary.totalInvestors ?? 0,
      subtitle: "CRM investor records",
      to: "/user-management",
      icon: Database,
      variant: "database",
    },
  ];

  if (showSkeleton) {
    return (
      <div className="overview-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="overview-kpi-grid">
      {cards.map((card, index) => (
        <OverviewKpiCard key={card.title} card={card} delay={index * 60} />
      ))}
    </div>
  );
};

export default DashboardCards;
