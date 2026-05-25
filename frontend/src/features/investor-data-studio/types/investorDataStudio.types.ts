export type InvestorSchemaField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  example: string;
  description: string;
  enum?: string[];
};

export type InvestorSchema = {
  headers: string[];
  requiredHeaders: string[];
  optionalHeaders: string[];
  fields: InvestorSchemaField[];
  maxRows: number;
  strictHeaderMatch: boolean;
  headerContract: string;
};

export type HeaderCheck = {
  ok: boolean;
  headers: string[];
  missing: string[];
  unexpected: string[];
  expected: string[];
  message: string;
};

export type ImportError = {
  row: number;
  field: string;
  message: string;
};

export type ImportPreviewRow = {
  rowNumber: number;
  No: number;
  Code_No: string;
  Name: string;
  Phone_No: number;
  Gender: string;
};

export type ImportSummary = {
  total: number;
  insert: number;
  update: number;
  skip: number;
  errors: number;
};

export type DryRunResult = {
  ok: boolean;
  headerCheck?: HeaderCheck;
  preview: ImportPreviewRow[];
  summary: ImportSummary;
  errors: ImportError[];
  totalRows: number;
};

export type CommitResult = {
  jobId: string;
  ok: boolean;
  counts?: { inserted: number; updated: number; skipped: number };
  summary?: ImportSummary;
  errors?: ImportError[];
};

export type ImportJob = {
  _id: string;
  fileName: string;
  status: "completed" | "failed" | "rejected";
  adminEmail: string;
  counts: { inserted: number; updated: number; skipped: number; total: number };
  errorCount: number;
  createdAt: string;
};
