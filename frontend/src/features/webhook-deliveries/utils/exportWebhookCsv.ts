import type { WebhookDelivery } from "../types/webhook.types";
import { formatWhen } from "./formatWebhook";

export function downloadWebhookCsv(rows: WebhookDelivery[]) {
  const headers = [
    "Time",
    "Provider",
    "Event Type",
    "Status",
    "HTTP Status",
    "Entity ID",
    "Error",
    "Processed At",
    "Payload Summary",
  ];

  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        formatWhen(row.createdAt),
        row.provider,
        row.eventTypeLabel,
        row.status,
        row.httpStatus != null ? String(row.httpStatus) : "",
        row.entityId,
        row.errorMessage,
        formatWhen(row.processedAt),
        JSON.stringify(row.payloadSummary || {}),
      ]
        .map((v) => escape(String(v)))
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `webhook-deliveries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
