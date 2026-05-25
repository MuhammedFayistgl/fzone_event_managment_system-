import API from "../../../api/axios";
import { saveBlob } from "../../../utils/downloadFile";
import type {
  CommitResult,
  DryRunResult,
  ImportJob,
  InvestorSchema,
} from "../types/investorDataStudio.types";

type ApiResponse<T> = { status: boolean; data: T; message?: string };

export const investorDataStudioKeys = {
  all: ["investor-data-studio"] as const,
  schema: () => [...investorDataStudioKeys.all, "schema"] as const,
  history: () => [...investorDataStudioKeys.all, "history"] as const,
};

export async function fetchInvestorSchema() {
  const res = await API.get<ApiResponse<InvestorSchema>>("/admin/investors/schema");
  return res.data.data;
}

export async function downloadInvestorTemplate() {
  const res = await API.get("/admin/investors/template.xlsx", {
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function downloadInvestorExport() {
  const res = await API.get("/admin/investors/export.xlsx", {
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function runInvestorImportDryRun(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post<ApiResponse<DryRunResult>>(
    "/admin/investors/import/dry-run",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export async function commitInvestorImport(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post<ApiResponse<CommitResult>>(
    "/admin/investors/import/commit",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function downloadInvestorErrorReport(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post("/admin/investors/import/error-report", form, {
    responseType: "blob",
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as Blob;
}

export async function fetchInvestorImportHistory() {
  const res = await API.get<ApiResponse<ImportJob[]>>(
    "/admin/investors/import/history?limit=20"
  );
  return res.data.data;
}

export { saveBlob };
