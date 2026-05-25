import { useEffect, useMemo } from "react";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AppPageLayout from "../../layouts/AppPageLayout";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { fetchCreatedEvents } from "../../redux/EventThunks";
import { StatCardGrid } from "./components/dashboard/StatCardGrid";
import { AuditLogFilters } from "./components/filters/AuditLogFilters";
import { AuditLogTable } from "./components/table/AuditLogTable";
import { AuditAnalyticsCharts } from "./components/charts/AuditAnalyticsCharts";
import { AuditDetailDrawer } from "./components/drawer/AuditDetailDrawer";
import {
  useAuditLogAnalytics,
  useAuditLogEntries,
  useAuditLogSummary,
  useExportAuditLog,
} from "./hooks/useAuditLogQueries";
import { useAuditLogStore } from "./store/auditLogStore";
import { AuditErrorState } from "./components/ui/primitives";
import { downloadAuditLogCsv } from "./utils/exportAuditLogCsv";
import "./audit-log.css";

const EXPORT_CAP = 10000;

export default function AuditLogDashboard() {
  const dispatch = useAppDispatch();
  const events = useAppSelector((s) => s.event.events || []);

  const drawerOpen = useAuditLogStore((s) => s.drawerOpen);
  const selectedEntryId = useAuditLogStore((s) => s.selectedEntryId);
  const openDrawer = useAuditLogStore((s) => s.openDrawer);
  const closeDrawer = useAuditLogStore((s) => s.closeDrawer);

  const summaryQuery = useAuditLogSummary();
  const entriesQuery = useAuditLogEntries();
  const analyticsQuery = useAuditLogAnalytics();
  const exportMutation = useExportAuditLog();

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

  const handleExport = async () => {
    try {
      const rows = await exportMutation.mutateAsync();
      if (!rows.length) {
        toast.error("No rows to export");
        return;
      }
      downloadAuditLogCsv(rows);
      if (rows.length >= EXPORT_CAP) {
        toast.success(`Exported ${rows.length} rows (10,000 row cap reached)`);
      } else {
        toast.success(`Exported ${rows.length} audit entries`);
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
      title="Audit Log"
      subtitle="Track admin actions — refunds, blocks, exports, settings, and payment operations."
      eyebrow="Platform Security"
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
          <AuditErrorState message="Could not load audit log data." onRetry={refreshAll} />
        )}

        <StatCardGrid summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        <AuditLogFilters
          eventOptions={eventOptions}
          total={entriesQuery.data?.pagination?.total}
        />

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-app-text">Activity ledger</h2>
          <AuditLogTable
            rows={entriesQuery.data?.rows ?? []}
            loading={entriesQuery.isLoading}
            pagination={entriesQuery.data?.pagination}
            onView={(row) => openDrawer(row._id)}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-app-text">Analytics</h2>
          {analyticsQuery.isError && (
            <AuditErrorState
              message="Could not load analytics."
              onRetry={() => analyticsQuery.refetch()}
            />
          )}
          <AuditAnalyticsCharts data={analyticsQuery.data} loading={analyticsQuery.isLoading} />
        </section>
      </div>

      <AuditDetailDrawer
        entryId={selectedEntryId}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </AppPageLayout>
  );
}
