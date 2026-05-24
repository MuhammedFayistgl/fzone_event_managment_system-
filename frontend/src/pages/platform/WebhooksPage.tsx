import { useEffect, useState } from "react";
import { format } from "date-fns";
import AppPageLayout from "../../layouts/AppPageLayout";
import API from "../../api/axios";

type WebhookRow = {
  _id: string;
  eventType: string;
  entityId?: string;
  status: string;
  httpStatus?: number | null;
  errorMessage?: string;
  createdAt: string;
};

export default function WebhooksPage() {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/platform/webhooks", { params: { limit: 100 } })
      .then((res) => setRows(res.data?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppPageLayout title="Webhook Deliveries" subtitle="Razorpay webhook processing history." embedded>
      <div className="app-card p-4">
        {loading ? (
          <p className="text-sm text-app-muted">Loading webhook log…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-app-muted">No webhook deliveries recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-app-muted border-b border-app-border">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">HTTP</th>
                  <th className="py-2 pr-3">Entity</th>
                  <th className="py-2 pr-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-b border-app-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {format(new Date(row.createdAt), "dd MMM yyyy, HH:mm:ss")}
                    </td>
                    <td className="py-2 pr-3">{row.eventType}</td>
                    <td className="py-2 pr-3">{row.status}</td>
                    <td className="py-2 pr-3">{row.httpStatus ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{row.entityId || "—"}</td>
                    <td className="py-2 pr-3 text-red-400">{row.errorMessage || "—"}</td>
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
