import { useEffect, useMemo } from "react";
import { Download, RefreshCw, Bell, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AppPageLayout from "../../layouts/AppPageLayout";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchCreatedEvents } from "../../redux/EventThunks";
import { StatCardGrid } from "./components/dashboard/StatCardGrid";
import { ReconciliationFilters } from "./components/filters/ReconciliationFilters";
import { ReconciliationTable } from "./components/table/ReconciliationTable";
import { AnalyticsCharts } from "./components/charts/AnalyticsCharts";
import { ActivityFeed } from "./components/activity/ActivityFeed";
import { TransactionDetailDrawer } from "./components/drawer/TransactionDetailDrawer";
import {
  useExportReconciliation,
  useReconciliationActivity,
  useReconciliationAnalytics,
  useReconciliationSummary,
  useReconciliationTransactions,
} from "./hooks/useReconciliationQueries";
import { useReconciliationStore } from "./store/reconciliationStore";
import { ReconErrorState } from "./components/ui/primitives";
import { downloadReconciliationCsv } from "./utils/exportReconciliationCsv";
import "./finance-reconciliation.css";

const EXPORT_CAP = 10000;

export default function FinanceReconciliationDashboard() {
  const dispatch = useAppDispatch();
  const events = useAppSelector((s) => s.event.events || []);

  const drawerOpen = useReconciliationStore((s) => s.drawerOpen);
  const selectedTransactionId = useReconciliationStore((s) => s.selectedTransactionId);
  const openDrawer = useReconciliationStore((s) => s.openDrawer);
  const closeDrawer = useReconciliationStore((s) => s.closeDrawer);

  const summaryQuery = useReconciliationSummary();
  const txQuery = useReconciliationTransactions();
  const analyticsQuery = useReconciliationAnalytics();
  const activityQuery = useReconciliationActivity();
  const exportMutation = useExportReconciliation();

  useEffect(() => {
    dispatch(fetchCreatedEvents(""));
  }, [dispatch]);

  const eventOptions = useMemo(
    () =>
      events.map((e: { _id: string; title?: string }) => ({
        label: e.title || "Untitled",
        value: String(e._id),
      })),
    [events]
  );

  const mismatchCount = summaryQuery.data?.disputed?.value ?? 0;

  const handleExport = async () => {
    try {
      const rows = await exportMutation.mutateAsync();
      if (!rows.length) {
        toast.error("No rows to export");
        return;
      }
      downloadReconciliationCsv(rows);
      if (rows.length >= EXPORT_CAP) {
        toast.success(`Exported ${rows.length} rows (10,000 row cap reached)`);
      } else {
        toast.success(`Exported ${rows.length} transactions`);
      }
    } catch {
      toast.error("Export failed");
    }
  };

  const refreshAll = () => {
    summaryQuery.refetch();
    txQuery.refetch();
    analyticsQuery.refetch();
    activityQuery.refetch();
  };

  return (
    <AppPageLayout
      title="Finance Reconciliation"
      subtitle="Match ledger payments with gateway settlements, detect mismatches, and export audit-ready reports."
      eyebrow="Finance Center"
      embedded
      maxWidth="wide"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {mismatchCount > 0 && (
            <span className="finance-recon-alert">
              <Bell size={14} />
              {mismatchCount} mismatch{mismatchCount !== 1 ? "es" : ""}
            </span>
          )}
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
      <div className="finance-recon-page space-y-5 pb-10">
        {(summaryQuery.isError || txQuery.isError) && (
          <ReconErrorState
            message="Could not load reconciliation data."
            onRetry={refreshAll}
          />
        )}

        <StatCardGrid summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        {summaryQuery.data?.note && (
          <p className="text-xs text-app-muted">{summaryQuery.data.note}</p>
        )}

        <ReconciliationFilters
          eventOptions={eventOptions}
          total={txQuery.data?.pagination?.total}
        />

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-app-text">Reconciliation ledger</h2>
          <ReconciliationTable
            rows={txQuery.data?.rows ?? []}
            loading={txQuery.isLoading}
            pagination={txQuery.data?.pagination}
            onView={(row) => openDrawer(row._id)}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-app-text">Analytics</h2>
          {analyticsQuery.isError && (
            <ReconErrorState
              message="Could not load analytics."
              onRetry={() => analyticsQuery.refetch()}
            />
          )}
          <AnalyticsCharts data={analyticsQuery.data} loading={analyticsQuery.isLoading} />
        </section>

        <section className="app-card-flat p-4 space-y-4">
          <h2 className="text-base font-semibold text-app-text">Recent activity</h2>
          {activityQuery.isError && (
            <ReconErrorState
              message="Could not load activity feed."
              onRetry={() => activityQuery.refetch()}
            />
          )}
          <ActivityFeed items={activityQuery.data} loading={activityQuery.isLoading} />
        </section>
      </div>

      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </AppPageLayout>
  );
}
