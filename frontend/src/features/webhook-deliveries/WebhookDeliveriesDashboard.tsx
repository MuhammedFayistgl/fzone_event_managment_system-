import { Download, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AppPageLayout from "../../layouts/AppPageLayout";
import { StatCardGrid } from "./components/dashboard/StatCardGrid";
import { WebhookFilters } from "./components/filters/WebhookFilters";
import { WebhookTable } from "./components/table/WebhookTable";
import { WebhookAnalyticsCharts } from "./components/charts/WebhookAnalyticsCharts";
import { WebhookDetailDrawer } from "./components/drawer/WebhookDetailDrawer";
import {
  useExportWebhooks,
  useWebhookAnalytics,
  useWebhookEntries,
  useWebhookSummary,
} from "./hooks/useWebhookQueries";
import { useWebhookStore } from "./store/webhookStore";
import { WebhookErrorState } from "./components/ui/primitives";
import { downloadWebhookCsv } from "./utils/exportWebhookCsv";
import "./webhook-deliveries.css";

const EXPORT_CAP = 10000;

export default function WebhookDeliveriesDashboard() {
  const drawerOpen = useWebhookStore((s) => s.drawerOpen);
  const selectedId = useWebhookStore((s) => s.selectedId);
  const openDrawer = useWebhookStore((s) => s.openDrawer);
  const closeDrawer = useWebhookStore((s) => s.closeDrawer);

  const summaryQuery = useWebhookSummary();
  const entriesQuery = useWebhookEntries();
  const analyticsQuery = useWebhookAnalytics();
  const exportMutation = useExportWebhooks();

  const handleExport = async () => {
    try {
      const rows = await exportMutation.mutateAsync();
      if (!rows.length) {
        toast.error("No rows to export");
        return;
      }
      downloadWebhookCsv(rows);
      if (rows.length >= EXPORT_CAP) {
        toast.success(`Exported ${rows.length} rows (10,000 row cap reached)`);
      } else {
        toast.success(`Exported ${rows.length} webhook deliveries`);
      }
    } catch {
      toast.error("Export failed");
    }
  };

  const refreshAll = () => {
    summaryQuery.refetch();
    entriesQuery.refetch();
    analyticsQuery.refetch();
  };

  return (
    <AppPageLayout
      title="Webhook Deliveries"
      subtitle="Razorpay webhook processing history — captures, refunds, and delivery status."
      eyebrow="Platform Integrations"
      embedded
      maxWidth="wide"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="reg-toolbar-btn" onClick={refreshAll}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="reg-toolbar-btn reg-toolbar-btn--primary"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Export CSV
          </button>
        </div>
      }
    >
      <div className="space-y-5 pb-10">
        {(summaryQuery.isError || entriesQuery.isError) && (
          <WebhookErrorState message="Could not load webhook delivery data." onRetry={refreshAll} />
        )}

        <StatCardGrid summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        <WebhookFilters total={entriesQuery.data?.pagination?.total} />

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-app-text">Delivery ledger</h2>
          <WebhookTable
            rows={entriesQuery.data?.rows ?? []}
            loading={entriesQuery.isLoading}
            pagination={entriesQuery.data?.pagination}
            onView={(row) => openDrawer(row._id)}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-app-text">Analytics</h2>
          {analyticsQuery.isError && (
            <WebhookErrorState
              message="Could not load analytics."
              onRetry={() => analyticsQuery.refetch()}
            />
          )}
          <WebhookAnalyticsCharts data={analyticsQuery.data} loading={analyticsQuery.isLoading} />
        </section>
      </div>

      <WebhookDetailDrawer
        deliveryId={selectedId}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </AppPageLayout>
  );
}
