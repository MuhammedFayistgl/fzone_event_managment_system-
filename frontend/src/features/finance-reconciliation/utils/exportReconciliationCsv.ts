import type { ReconciliationTransaction } from "../types/reconciliation.types";

export function downloadReconciliationCsv(rows: ReconciliationTransaction[]) {
  const headers = [
    "Transaction ID",
    "Customer",
    "Phone",
    "Amount",
    "Method",
    "Gateway",
    "Settlement",
    "Reconciliation",
    "Variance",
    "Date",
    "Event",
  ];

  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.razorpay_payment_id || r.razorpay_order_id,
        r.investorName || "",
        r.phone,
        r.amount,
        r.method,
        r.gateway,
        r.settlementStatus,
        r.reconciliationStatus,
        r.variance,
        r.paidAt || r.createdAt,
        r.event?.title || "",
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
