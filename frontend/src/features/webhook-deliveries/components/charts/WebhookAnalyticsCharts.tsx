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
import type { WebhookAnalytics } from "../../types/webhook.types";
import { formatStatusLabel } from "../../utils/formatWebhook";
import { WebhookSkeleton } from "../ui/primitives";

const PIE_COLORS = ["#10b981", "#ef4444", "#64748b", "#f59e0b", "#6366f1"];

function useChartTheme() {
  const isDark = useAppSelector((s) => s.theme.mode) === "dark";
  return useMemo(
    () => ({
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
      axis: isDark ? "#a1a1aa" : "#64748b",
      tooltipBg: isDark ? "#0c0e1a" : "#ffffff",
      tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
      tooltipText: isDark ? "#f4f4f5" : "#1f2937",
      primary: isDark ? "#22d3ee" : "#6366f1",
    }),
    [isDark]
  );
}

type Props = {
  data?: WebhookAnalytics;
  loading?: boolean;
};

export function WebhookAnalyticsCharts({ data, loading }: Props) {
  const theme = useChartTheme();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="webhook-chart-card">
            <WebhookSkeleton className="h-full min-h-[220px]" />
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

  const statusData = data.byStatus.map((s) => ({
    ...s,
    label: formatStatusLabel(s.status),
  }));

  const httpData = data.httpStatusBreakdown.map((h) => ({
    ...h,
    label: String(h.httpStatus),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Daily webhook volume">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.dailyTrend}>
            <defs>
              <linearGradient id="webhookGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.primary} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <YAxis tick={{ fontSize: 11, fill: theme.axis }} stroke={theme.grid} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="count" stroke={theme.primary} fill="url(#webhookGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Deliveries by status">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={72}
              label={{ fill: theme.axis, fontSize: 10 }}
            >
              {statusData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: theme.axis, fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top event types">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.topEventTypes} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: theme.axis }} stroke={theme.grid} />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              tick={{ fill: theme.axis, fontSize: 10 }}
              stroke={theme.grid}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill={theme.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="HTTP status codes">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={httpData}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: theme.axis }} stroke={theme.grid} />
            <YAxis tick={{ fill: theme.axis }} stroke={theme.grid} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="webhook-chart-card">
      <h3 className="text-sm font-semibold mb-3 text-app-text">{title}</h3>
      {children}
    </div>
  );
}
