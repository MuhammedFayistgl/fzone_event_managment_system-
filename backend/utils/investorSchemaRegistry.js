/** Canonical investor import/export schema — single source of truth */

export const INVESTOR_CANONICAL_HEADERS = [
  "No",
  "Code_No",
  "Name",
  "Phone_No",
  "Gender",
];

export const INVESTOR_REQUIRED_HEADERS = ["No", "Code_No", "Name", "Phone_No"];

export const INVESTOR_OPTIONAL_HEADERS = ["Gender"];

export const MAX_IMPORT_ROWS = 5000;

export const INVESTOR_SCHEMA_FIELDS = [
  {
    key: "No",
    label: "No",
    type: "number",
    required: true,
    example: "1",
    description: "Serial number in the investor list",
  },
  {
    key: "Code_No",
    label: "Code",
    type: "string",
    required: true,
    example: "FP001",
    description: "Unique investor code (stored uppercase)",
  },
  {
    key: "Name",
    label: "Name",
    type: "string",
    required: true,
    example: "Mohammed Ali",
    description: "Full name — must match header exactly as Name",
  },
  {
    key: "Phone_No",
    label: "Phone",
    type: "number",
    required: true,
    example: "9876543210",
    description: "10-digit mobile number",
  },
  {
    key: "Gender",
    label: "Gender",
    type: "enum",
    required: false,
    example: "Male",
    enum: ["Male", "Female", "Other"],
    description: "Optional — inferred from name when empty",
  },
];

export function getInvestorSchema() {
  return {
    headers: [...INVESTOR_CANONICAL_HEADERS],
    requiredHeaders: [...INVESTOR_REQUIRED_HEADERS],
    optionalHeaders: [...INVESTOR_OPTIONAL_HEADERS],
    fields: INVESTOR_SCHEMA_FIELDS,
    maxRows: MAX_IMPORT_ROWS,
    strictHeaderMatch: true,
    headerContract:
      "Row 1 must use exact column names: No, Code_No, Name, Phone_No, Gender (case-sensitive). Gender column is optional.",
  };
}

/**
 * Strict header validation — no fuzzy aliases.
 * @param {string[]} headers - column names from row 1
 */
export function validateStrictHeaders(headers) {
  const normalized = (headers || []).map((h) => String(h ?? "").trim());
  const nonEmpty = normalized.filter(Boolean);

  const missing = INVESTOR_REQUIRED_HEADERS.filter((h) => !nonEmpty.includes(h));
  const allowed = new Set(INVESTOR_CANONICAL_HEADERS);
  const unexpected = nonEmpty.filter((h) => !allowed.has(h));

  const orderOk =
    missing.length === 0 &&
    unexpected.length === 0 &&
    INVESTOR_CANONICAL_HEADERS.every((h, i) => {
      if (h === "Gender" && !nonEmpty.includes("Gender")) return true;
      const idx = nonEmpty.indexOf(h);
      if (idx === -1) return h === "Gender";
      return idx === i || !INVESTOR_CANONICAL_HEADERS.slice(0, i).every((prev) => nonEmpty.includes(prev));
    });

  const ok = missing.length === 0 && unexpected.length === 0;

  return {
    ok,
    headers: nonEmpty,
    missing,
    unexpected,
    expected: [...INVESTOR_CANONICAL_HEADERS],
    message: ok
      ? "Headers match the canonical schema"
      : [
          missing.length ? `Missing: ${missing.join(", ")}` : "",
          unexpected.length ? `Unexpected: ${unexpected.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(". "),
  };
}

export function buildTemplateRows() {
  return [
    {
      No: 1,
      Code_No: "FP001",
      Name: "Example Investor",
      Phone_No: 9876543210,
      Gender: "Male",
    },
  ];
}

export function investorToExportRow(doc) {
  return {
    No: doc.No,
    Code_No: doc.Code_No,
    Name: doc.Name,
    Phone_No: doc.Phone_No,
    Gender: doc.Gender || "Other",
  };
}
