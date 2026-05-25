import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { SummaryMetric } from "../../types/webhook.types";

type Props = {
  title: string;
  metric?: SummaryMetric;
  icon: LucideIcon;
  loading?: boolean;
  variant?: "registrations" | "passes" | "checkins" | "pending" | "revenue" | "database";
  index?: number;
};

export function StatCard({
  title,
  metric,
  icon: Icon,
  loading,
  variant = "registrations",
  index = 0,
}: Props) {
  if (loading) return <div className="overview-kpi-skeleton" aria-hidden />;

  const TrendIcon = metric?.trend === "down" ? TrendingDown : TrendingUp;
  const trendClass =
    metric?.trend === "down" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400";

  return (
    <motion.article
      className={`overview-kpi-card overview-kpi-card--${variant} pro-animate-in`}
      style={{ ["--pro-delay" as string]: `${index * 50}ms` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <span className="overview-kpi-card__glow" aria-hidden />
      <div className="overview-kpi-card__head">
        <p className="overview-kpi-card__label">{title}</p>
        <div className="overview-kpi-card__icon-wrap" aria-hidden>
          <Icon className="w-5 h-5" strokeWidth={2.25} />
        </div>
      </div>
      <h2 className="overview-kpi-card__value">{(metric?.value ?? 0).toLocaleString()}</h2>
      {metric && (
        <div className="overview-kpi-card__foot">
          <p className="overview-kpi-card__subtitle flex items-center gap-1">
            <TrendIcon size={14} className={trendClass} />
            <span>{Math.abs(metric.changePct)}% vs prior period</span>
          </p>
        </div>
      )}
    </motion.article>
  );
}
