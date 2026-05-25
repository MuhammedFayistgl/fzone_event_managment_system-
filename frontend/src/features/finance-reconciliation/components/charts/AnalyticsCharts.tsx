import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppSelector } from "../../../../hooks/hooks";
import type { ReconciliationAnalytics } from "../../types/reconciliation.types";
import { ReconSkeleton } from "../ui/primitives";

const PIE_COLORS = ["#22d3ee", "#4ade80", "#fbbf24", "#f87171", "#c084fc"];

function useChartTheme() {
  const isDark = useAppSelector((s) => s.theme.mode) === "dark";

  return useMemo(
    () => ({
      isDark,
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
      axis: isDark ? "#a1a1aa" : "#64748b",
      tooltipBg: isDark ? "#0c0e1a" : "#ffffff",
      tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
      tooltipText: isDark ? "#f4f4f5" : "#1f2937",
      primary: isDark ? "#22d3ee" : "#6366f1",
      success: isDark ? "#4ade80" : "#10b981",
      danger: isDark ? "#f87171" : "#ef4444",
    }),
    [isDark]
  );
}

type Props = {
  data?: ReconciliationAnalytics;
  loading?: boolean;
};

export function AnalyticsCharts({ data, loading }: Props) {
  const theme = useChartTheme();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="finance-recon-chart-card">
            <ReconSkeleton className="h-full min-h-[240px]" />
          </div>
        ))}
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: theme.tooltipBg,
    border: `1px solid ${theme.tooltipBorder}`,
    borderRadius: "0.65rem",
    color: theme.tooltipText,
    fontSize: "0.75rem",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Daily reconciliation trend">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.dailyTrend}>
            <defs>
              <linearGradient id="reconGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <YAxis tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="matched"
              stroke={theme.primary}
              fill="url(#reconGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue analytics">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.revenueByDay}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <YAxis tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="amount" fill={theme.success} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Failed transactions">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.failedByDay}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <YAxis tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill={theme.danger} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Payment methods">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data.paymentMethods}
              dataKey="count"
              nameKey="method"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={{ fill: theme.axis, fontSize: 11 }}
            >
              {data.paymentMethods.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: theme.axis, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly settlements" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.monthlySettlements}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: theme.axis }} stroke={theme.grid} />
            <YAxis tick={{ fill: theme.axis }} stroke={theme.grid} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="amount" fill={theme.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`finance-recon-chart-card ${className}`}>
      <h3 className="text-sm font-semibold mb-3 text-app-text">{title}</h3>
      {children}
    </div>
  );
}
