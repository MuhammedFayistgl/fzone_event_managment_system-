import { useState } from "react";
import { Database, PauseCircle, PlayCircle, Power, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { usePlatformOpsMutations } from "../hooks/usePlatformOpsQueries";
import type { PlatformOverview } from "../api/platformOpsApi";
import { formatBytes } from "../utils/formatOps";

type Props = {
  overview?: PlatformOverview;
  backups?: { fileName: string; bytes: number; createdAt: string }[];
  isSuperAdmin?: boolean;
  onRefresh: () => void;
};

export function ServerActionsPanel({
  overview,
  backups,
  isSuperAdmin,
  onRefresh,
}: Props) {
  const mutations = usePlatformOpsMutations();
  const [maintMsg, setMaintMsg] = useState(
    overview?.maintenanceMessage ||
      "Scheduled maintenance in progress. Public registration is temporarily unavailable."
  );
  const [restoreFile, setRestoreFile] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="pcc-actions app-card">
        <p className="pcc-empty">Server controls are available to super admins only.</p>
      </div>
    );
  }

  const run = async (action: string) => {
    try {
      if (action === "maint-on") {
        await mutations.patchMaintenance.mutateAsync({ enabled: true, message: maintMsg });
        toast.success("Maintenance mode enabled");
      } else if (action === "maint-off") {
        await mutations.patchMaintenance.mutateAsync({ enabled: false });
        toast.success("Maintenance mode disabled");
      } else if (action === "backup") {
        const res = await mutations.createBackup.mutateAsync();
        toast.success(`Backup created (${formatBytes(res.bytes)})`);
      } else if (action === "restore") {
        if (!restoreFile) return toast.error("Select a backup file");
        await mutations.restoreBackup.mutateAsync(restoreFile);
        toast.success("Database restored");
      } else if (action === "restart") {
        const res = await mutations.restartServer.mutateAsync();
        if (res.manual) toast(res.message);
        else toast.success("Restart requested via Railway");
      }
      setConfirm(null);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <div className="pcc-actions app-card">
      <h3 className="pcc-panel-title">Server control panel</h3>

      <div className="pcc-actions-grid">
        <section>
          <h4><Wrench size={16} /> Maintenance mode</h4>
          <textarea
            className="pcc-textarea"
            rows={3}
            value={maintMsg}
            onChange={(e) => setMaintMsg(e.target.value)}
          />
          <div className="pcc-actions-row">
            <button
              type="button"
              className="pcc-btn pcc-btn--warn"
              onClick={() => setConfirm("maint-on")}
            >
              <PauseCircle size={14} /> Enable maintenance
            </button>
            <button
              type="button"
              className="pcc-btn pcc-btn--ghost"
              onClick={() => setConfirm("maint-off")}
            >
              <PlayCircle size={14} /> Disable maintenance
            </button>
          </div>
        </section>

        <section>
          <h4><Database size={16} /> Database backup & restore</h4>
          <button type="button" className="pcc-btn pcc-btn--primary" onClick={() => setConfirm("backup")}>
            Create backup
          </button>
          <select
            className="pcc-select"
            value={restoreFile}
            onChange={(e) => setRestoreFile(e.target.value)}
          >
            <option value="">Select backup to restore…</option>
            {(backups || []).map((b) => (
              <option key={b.fileName} value={b.fileName}>
                {b.fileName} ({formatBytes(b.bytes)})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="pcc-btn pcc-btn--danger"
            onClick={() => setConfirm("restore")}
          >
            Restore backup
          </button>
        </section>

        <section>
          <h4><Power size={16} /> Restart deployment</h4>
          <p className="pcc-hint">Uses Railway API when `RAILWAY_TOKEN` is configured; otherwise shows manual steps.</p>
          <button type="button" className="pcc-btn pcc-btn--danger" onClick={() => setConfirm("restart")}>
            Restart server
          </button>
        </section>
      </div>

      {confirm && (
        <div className="pcc-confirm">
          <p>Confirm dangerous action: <strong>{confirm}</strong></p>
          <div className="pcc-actions-row">
            <button type="button" className="pcc-btn pcc-btn--ghost" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button type="button" className="pcc-btn pcc-btn--danger" onClick={() => run(confirm)}>
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
