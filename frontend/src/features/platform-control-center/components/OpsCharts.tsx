import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppSelector } from "../../../hooks/hooks";

function useChartTheme() {
  const isDark = useAppSelector((s) => s.theme.mode) === "dark";
  return useMemo(
    () => ({
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
      axis: isDark ? "#a1a1aa" : "#64748b",
      primary: isDark ? "#22d3ee" : "#6366f1",
      secondary: isDark ? "#4ade80" : "#10b981",
      tooltipBg: isDark ? "#0c0e1a" : "#ffffff",
      tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
      tooltipText: isDark ? "#f4f4f5" : "#1f2937",
    }),
    [isDark]
  );
}

type MetricPoint = {
  at: string;
  memoryUsedBytes?: number;
  mongoStorageSizeBytes?: number;
  apiRequestsMonth?: number;
  onlineConnections?: number;
};

export function OpsCharts({
  points,
  loading,
}: {
  points?: MetricPoint[];
  loading?: boolean;
}) {
  const theme = useChartTheme();

  const chartData = useMemo(
    () =>
      (points || []).map((p) => ({
        time: new Date(p.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        memoryMb: Math.round((p.memoryUsedBytes || 0) / (1024 * 1024)),
        storageMb: Math.round((p.mongoStorageSizeBytes || 0) / (1024 * 1024)),
        api: p.apiRequestsMonth || 0,
        online: p.onlineConnections || 0,
      })),
    [points]
  );

  const tooltipStyle = {
    backgroundColor: theme.tooltipBg,
    border: `1px solid ${theme.tooltipBorder}`,
    borderRadius: "0.65rem",
    color: theme.tooltipText,
    fontSize: "0.75rem",
  };

  if (loading) {
    return <div className="pcc-charts-grid"><div className="pcc-chart-card pcc-skeleton h-[280px]" /><div className="pcc-chart-card pcc-skeleton h-[280px]" /></div>;
  }

  return (
    <div className="pcc-charts-grid">
      <div className="pcc-chart-card app-card">
        <h3 className="pcc-panel-title">Memory & Mongo storage</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke={theme.axis} fontSize={11} tickLine={false} />
            <YAxis stroke={theme.axis} fontSize={11} tickLine={false} width={42} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="memoryMb" stroke={theme.primary} fill={theme.primary} fillOpacity={0.15} name="RAM MB" />
            <Area type="monotone" dataKey="storageMb" stroke={theme.secondary} fill={theme.secondary} fillOpacity={0.12} name="Mongo MB" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="pcc-chart-card app-card">
        <h3 className="pcc-panel-title">API usage & online users</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke={theme.axis} fontSize={11} tickLine={false} />
            <YAxis stroke={theme.axis} fontSize={11} tickLine={false} width={42} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="api" stroke={theme.primary} fill={theme.primary} fillOpacity={0.15} name="API month" />
            <Area type="monotone" dataKey="online" stroke={theme.secondary} fill={theme.secondary} fillOpacity={0.12} name="Online" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const PIE_COLORS = ["#22d3ee", "#6366f1", "#c084fc", "#fbbf24"];

export function AnalyticsChartsPanel({
  analytics,
  loading,
}: {
  analytics?: {
    metrics: MetricPoint[];
    revenueByMonth: { label: string; total: number }[];
    billing: { planDistribution: { tier: string; count: number }[] };
  };
  loading?: boolean;
}) {
  const theme = useChartTheme();

  if (loading || !analytics) {
    return <div className="pcc-charts-grid"><div className="pcc-chart-card pcc-skeleton h-[280px]" /><div className="pcc-chart-card pcc-skeleton h-[280px]" /></div>;
  }

  const tooltipStyle = {
    backgroundColor: theme.tooltipBg,
    border: `1px solid ${theme.tooltipBorder}`,
    borderRadius: "0.65rem",
    color: theme.tooltipText,
    fontSize: "0.75rem",
  };

  const growthData = analytics.metrics.map((p) => ({
    label: new Date(p.at).toLocaleDateString([], { month: "short", day: "numeric" }),
    storageMb: Math.round((p.mongoStorageSizeBytes || 0) / (1024 * 1024)),
    api: p.apiRequestsMonth || 0,
  }));

  return (
    <div className="pcc-charts-grid pcc-charts-grid--analytics">
      <div className="pcc-chart-card app-card">
        <h3 className="pcc-panel-title">Platform revenue (INR)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={analytics.revenueByMonth}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke={theme.axis} fontSize={11} />
            <YAxis stroke={theme.axis} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="total" fill={theme.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="pcc-chart-card app-card">
        <h3 className="pcc-panel-title">Storage & API growth</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={growthData}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke={theme.axis} fontSize={11} />
            <YAxis stroke={theme.axis} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="storageMb" stroke={theme.secondary} fill={theme.secondary} fillOpacity={0.15} name="Storage MB" />
            <Area type="monotone" dataKey="api" stroke={theme.primary} fill={theme.primary} fillOpacity={0.12} name="API" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="pcc-chart-card app-card">
        <h3 className="pcc-panel-title">Plan distribution</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={analytics.billing.planDistribution} dataKey="count" nameKey="tier" outerRadius={90} label>
              {analytics.billing.planDistribution.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
