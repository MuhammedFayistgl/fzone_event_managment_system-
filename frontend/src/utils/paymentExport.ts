import type { PaymentLedgerRow } from "../Types/paymentLedger.types";

type PaymentExportRow = PaymentLedgerRow | {
  event?: string;
  investorName?: string;
  phone?: string;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  guestCount?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  paidAt?: string | null;
  createdAt?: string | null;
  refundAmount?: number;
};

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function downloadPaymentsCsv(rows: PaymentExportRow[], filename = "payments-ledger.csv") {
  const headers = [
    "Paid At",
    "Created At",
    "Event",
    "Investor",
    "Phone",
    "Amount",
    "Currency",
    "Status",
    "Method",
    "Guests",
    "Order ID",
    "Payment ID",
  ];

  const lines = rows.map((row) =>
    [
      formatDate(row.paidAt),
      formatDate(row.createdAt),
      typeof row.event === "string" ? row.event : row.event?.title || "",
      row.investorName || "",
      row.phone,
      row.amount,
      row.currency,
      row.status,
      row.method || "",
      row.guestCount ?? 0,
      row.razorpay_order_id,
      row.razorpay_payment_id || "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getPaymentDateRangeBounds(range: "all" | "today" | "7d" | "30d") {
  if (range === "all") {
    return { dateFrom: undefined, dateTo: undefined };
  }

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
  }

  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
  };
}
