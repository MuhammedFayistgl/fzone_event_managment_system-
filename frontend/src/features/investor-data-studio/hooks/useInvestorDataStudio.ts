import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  commitInvestorImport,
  downloadInvestorErrorReport,
  downloadInvestorExport,
  downloadInvestorTemplate,
  fetchInvestorImportHistory,
  fetchInvestorSchema,
  investorDataStudioKeys,
  runInvestorImportDryRun,
  saveBlob,
} from "../api/investorDataStudioApi";

export function useInvestorSchema() {
  return useQuery({
    queryKey: investorDataStudioKeys.schema(),
    queryFn: fetchInvestorSchema,
    staleTime: 60_000,
  });
}

export function useInvestorImportHistory() {
  return useQuery({
    queryKey: investorDataStudioKeys.history(),
    queryFn: fetchInvestorImportHistory,
  });
}

export function useInvestorTemplateDownload() {
  return useMutation({
    mutationFn: async () => {
      const blob = await downloadInvestorTemplate();
      saveBlob(blob, "investor_template.xlsx");
    },
  });
}

export function useInvestorExportDownload() {
  return useMutation({
    mutationFn: async () => {
      const blob = await downloadInvestorExport();
      saveBlob(blob, "investors_export.xlsx");
    },
  });
}

export function useInvestorImportDryRun() {
  return useMutation({
    mutationFn: (file: File) => runInvestorImportDryRun(file),
  });
}

export function useInvestorImportCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => commitInvestorImport(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: investorDataStudioKeys.history() });
    },
  });
}

export function useInvestorErrorReportDownload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const blob = await downloadInvestorErrorReport(file);
      saveBlob(blob, "investor_import_errors.xlsx");
    },
  });
}
