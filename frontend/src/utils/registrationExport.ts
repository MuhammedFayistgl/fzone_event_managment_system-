type RegistrationExportRow = {
  name: string;
  phone: string;
  category?: string;
  eventTitle?: string;
  guestCount?: number;
  passStatus?: string;
  checkIn?: boolean;
  createdAt?: string | Date;
};

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function downloadRegistrationsCsv(
  rows: RegistrationExportRow[],
  filename = "registrations.csv"
) {
  const headers = [
    "Registered At",
    "Event",
    "Name",
    "Phone",
    "Category",
    "Guests",
    "Pass Status",
    "Checked In",
  ];

  const lines = rows.map((row) =>
    [
      formatDate(row.createdAt),
      row.eventTitle || "",
      row.name,
      row.phone,
      row.category || "",
      row.guestCount ?? 0,
      row.passStatus || "",
      row.checkIn ? "Yes" : "No",
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
