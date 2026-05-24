import { useEffect, useState } from "react";
import { format } from "date-fns";
import AppPageLayout from "../../layouts/AppPageLayout";
import API from "../../api/axios";

type AuditRow = {
  _id: string;
  action: string;
  category: string;
  actorEmail?: string;
  actorRole?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    setLoading(true);
    API.get("/admin/platform/audit-logs", {
      params: { category: category || undefined, limit: 100 },
    })
      .then((res) => setRows(res.data?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <AppPageLayout title="Audit Log" subtitle="Admin actions across refunds, blocks, exports, and settings." embedded>
      <div className="app-card p-4 space-y-4">
        <select
          className="event-register-guests__select max-w-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          <option value="refund">Refunds</option>
          <option value="block">Blocks</option>
          <option value="export">Exports</option>
          <option value="payment">Payments</option>
          <option value="settings">Settings</option>
          <option value="webhook">Webhooks</option>
        </select>

        {loading ? (
          <p className="text-sm text-app-muted">Loading audit log…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-app-muted">No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-app-muted border-b border-app-border">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Actor</th>
                  <th className="py-2 pr-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-b border-app-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {format(new Date(row.createdAt), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{row.action}</span>
                      <span className="text-app-muted"> · {row.category}</span>
                    </td>
                    <td className="py-2 pr-3">{row.actorEmail || "system"}</td>
                    <td className="py-2 pr-3 text-app-muted">
                      {row.phone ? `Phone ${row.phone}` : JSON.stringify(row.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppPageLayout>
  );
}
