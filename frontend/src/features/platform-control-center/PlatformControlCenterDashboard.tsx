import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import AppPageLayout from "../../layouts/AppPageLayout";
import { useAdminProfile } from "../../hooks/useAdminProfile";
import {
  useBillingOverview,
  usePlatformAnalytics,
  usePlatformBackups,
  usePlatformInvoices,
  usePlatformLogs,
  usePlatformMetrics,
  usePlatformOverview,
  useSubscriptionPlans,
} from "./hooks/usePlatformOpsQueries";
import { usePlatformOpsStore } from "./store/platformOpsStore";
import { StatusHero } from "./components/StatusHero";
import { MetricStatGrid } from "./components/MetricStatGrid";
import { UsageQuotaBars } from "./components/UsageQuotaBars";
import { OpsCharts, AnalyticsChartsPanel } from "./components/OpsCharts";
import { DeploymentCard } from "./components/DeploymentCard";
import { ErrorLogTable } from "./components/ErrorLogTable";
import { ServerActionsPanel } from "./components/ServerActionsPanel";
import {
  BillingHistoryTable,
  PricingCards,
  SubscriptionControls,
} from "./components/BillingSection";
import "./platform-control-center.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "billing", label: "Billing" },
  { id: "analytics", label: "Analytics" },
  { id: "server", label: "Server" },
] as const;

export default function PlatformControlCenterDashboard() {
  const { isSuperAdmin } = useAdminProfile();
  const activeTab = usePlatformOpsStore((s) => s.activeTab);
  const metricsRange = usePlatformOpsStore((s) => s.metricsRange);
  const setActiveTab = usePlatformOpsStore((s) => s.setActiveTab);
  const setMetricsRange = usePlatformOpsStore((s) => s.setMetricsRange);

  const overviewQuery = usePlatformOverview();
  const metricsQuery = usePlatformMetrics(metricsRange);
  const logsQuery = usePlatformLogs(1);
  const billingQuery = useBillingOverview();
  const plansQuery = useSubscriptionPlans();
  const invoicesQuery = usePlatformInvoices(1);
  const analyticsQuery = usePlatformAnalytics("30d");
  const backupsQuery = usePlatformBackups();

  const refreshAll = () => {
    overviewQuery.refetch();
    metricsQuery.refetch();
    logsQuery.refetch();
    billingQuery.refetch();
    plansQuery.refetch();
    invoicesQuery.refetch();
    analyticsQuery.refetch();
    backupsQuery.refetch();
    toast.success("Control center refreshed");
  };

  const overview = overviewQuery.data;

  return (
    <AppPageLayout
      title="Control Center"
      subtitle="Monitor server health, MongoDB usage, deployment status, plan quotas, and billing — without opening Atlas or Railway."
      eyebrow="Platform Ops"
      embedded
      maxWidth="wide"
      actions={
        <button type="button" className="reg-toolbar-btn" onClick={refreshAll}>
          <RefreshCw size={14} />
          Refresh
        </button>
      }
    >
      <StatusHero data={overview} />

      <div className="pcc-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={clsx("pcc-tab", activeTab === tab.id && "pcc-tab--active")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="pcc-stack">
          <MetricStatGrid data={overview} />
          <div className="pcc-two-col">
            <UsageQuotaBars data={overview} />
            <DeploymentCard data={overview} />
          </div>
          <div className="pcc-range-row">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={clsx("pcc-range-btn", metricsRange === r && "pcc-range-btn--active")}
                onClick={() => setMetricsRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <OpsCharts points={metricsQuery.data?.points} loading={metricsQuery.isLoading} />
          <ErrorLogTable items={logsQuery.data?.items} loading={logsQuery.isLoading} />
        </div>
      )}

      {activeTab === "billing" && (
        <div className="pcc-stack">
          <SubscriptionControls
            overview={overview}
            billing={billingQuery.data}
            isSuperAdmin={isSuperAdmin}
            onRefresh={refreshAll}
          />
          <PricingCards
            plans={plansQuery.data}
            currentPlan={billingQuery.data?.currentPlan || overview?.plan}
            isSuperAdmin={isSuperAdmin}
            onRefresh={refreshAll}
          />
          <BillingHistoryTable invoices={invoicesQuery.data?.items || billingQuery.data?.recentInvoices} />
        </div>
      )}

      {activeTab === "analytics" && (
        <AnalyticsChartsPanel analytics={analyticsQuery.data} loading={analyticsQuery.isLoading} />
      )}

      {activeTab === "server" && (
        <ServerActionsPanel
          overview={overview}
          backups={backupsQuery.data}
          isSuperAdmin={isSuperAdmin}
          onRefresh={refreshAll}
        />
      )}
    </AppPageLayout>
  );
}
