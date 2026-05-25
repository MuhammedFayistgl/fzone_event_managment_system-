import type { AuditLogEntry } from "../types/auditLog.types";
import { formatWhen } from "./formatAuditLog";

export function downloadAuditLogCsv(rows: AuditLogEntry[]) {
  const headers = [
    "Time",
    "Action",
    "Category",
    "Severity",
    "Actor Email",
    "Actor Role",
    "Event",
    "Target Type",
    "Target ID",
    "Phone",
    "IP",
    "Metadata",
  ];

  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        formatWhen(row.createdAt),
        row.actionLabel,
        row.category,
        row.severity,
        row.actorEmail || "system",
        row.actorRole,
        row.eventTitle || "",
        row.targetType,
        row.targetId,
        row.phone,
        row.ip,
        JSON.stringify(row.metadata || {}),
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
