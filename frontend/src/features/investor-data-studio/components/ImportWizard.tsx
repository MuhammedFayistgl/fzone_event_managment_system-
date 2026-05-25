import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { DryRunResult } from "../types/investorDataStudio.types";
import {
  useInvestorErrorReportDownload,
  useInvestorImportCommit,
  useInvestorImportDryRun,
} from "../hooks/useInvestorDataStudio";

const STEPS = ["Upload", "Headers", "Preview", "Validation", "Confirm"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ImportWizard({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);

  const dryRunMutation = useInvestorImportDryRun();
  const commitMutation = useInvestorImportCommit();
  const errorReport = useInvestorErrorReportDownload();

  const reset = () => {
    setStep(0);
    setFile(null);
    setDryRun(null);
    dryRunMutation.reset();
    commitMutation.reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  const headerItems = useMemo(() => {
    const expected = dryRun?.headerCheck?.expected || [
      "No",
      "Code_No",
      "Name",
      "Phone_No",
      "Gender",
    ];
    const present = new Set(dryRun?.headerCheck?.headers || []);
    return expected.map((h) => ({
      name: h,
      ok: present.has(h) || h === "Gender",
      optional: h === "Gender",
    }));
  }, [dryRun]);

  if (!open) return null;

  const handleFile = async (f: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|csv)$/i.test(f.name)) {
      toast.error("Only .xlsx or .csv files are allowed");
      return;
    }
    setFile(f);
    setDryRun(null);
    try {
      const result = await dryRunMutation.mutateAsync(f);
      setDryRun(result);
      setStep(1);
    } catch {
      toast.error("Failed to analyze file");
    }
  };

  const goConfirm = () => {
    if (!dryRun?.ok) {
      toast.error("Fix all errors before continuing");
      return;
    }
    setStep(4);
  };

  const handleCommit = async () => {
    if (!file || !dryRun?.ok) return;
    try {
      const res = await commitMutation.mutateAsync(file);
      if (res.status && res.data?.ok) {
        toast.success(
          `Import complete — ${res.data.counts?.inserted || 0} added, ${res.data.counts?.updated || 0} updated`
        );
        onSuccess();
        close();
      } else {
        toast.error(res.message || "Import rejected");
        if (res.data?.errors) {
          setDryRun((prev) =>
            prev
              ? {
                  ...prev,
                  ok: false,
                  errors: res.data?.errors || prev.errors,
                }
              : prev
          );
          setStep(3);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Import failed";
      toast.error(msg);
      const errors = err?.response?.data?.data?.errors;
      if (errors) {
        setDryRun((prev) => (prev ? { ...prev, ok: false, errors } : prev));
        setStep(3);
      }
    }
  };

  return (
    <div className="ids-wizard-backdrop" role="presentation" onClick={close}>
      <div
        className="ids-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ids-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ids-wizard__header">
          <h2 id="ids-wizard-title">Import investors</h2>
          <button type="button" className="ids-wizard__close" onClick={close} aria-label="Close">
            ×
          </button>
        </header>

        <ol className="ids-wizard__steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`ids-wizard__step${i === step ? " ids-wizard__step--active" : ""}${i < step ? " ids-wizard__step--done" : ""}`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        <div className="ids-wizard__body">
          {step === 0 && (
            <div className="ids-upload-zone">
              <p>Upload your Excel file (.xlsx) or CSV with exact headers on row 1.</p>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              {dryRunMutation.isPending && <p>Analyzing file…</p>}
            </div>
          )}

          {step === 1 && dryRun && (
            <div>
              <p className={dryRun.headerCheck?.ok ? "ids-ok" : "ids-err"}>
                {dryRun.headerCheck?.message}
              </p>
              <ul className="ids-header-checklist">
                {headerItems.map((h) => (
                  <li key={h.name} className={h.ok ? "ids-ok" : "ids-err"}>
                    {h.ok ? "✓" : "✗"} <code>{h.name}</code>
                    {h.optional ? " (optional)" : ""}
                  </li>
                ))}
              </ul>
              {!dryRun.headerCheck?.ok && (
                <p className="ids-err">
                  Missing: {(dryRun.headerCheck?.missing || []).join(", ") || "—"}
                  {(dryRun.headerCheck?.unexpected?.length || 0) > 0 &&
                    ` · Unexpected: ${dryRun.headerCheck?.unexpected?.join(", ")}`}
                </p>
              )}
            </div>
          )}

          {step === 2 && dryRun && (
            <div>
              <p>{dryRun.totalRows} data row(s) — showing first {dryRun.preview.length}</p>
              <div className="ids-preview-table-wrap">
                <table className="ids-preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>No</th>
                      <th>Code_No</th>
                      <th>Name</th>
                      <th>Phone_No</th>
                      <th>Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRun.preview.map((r) => (
                      <tr key={r.rowNumber}>
                        <td>{r.rowNumber}</td>
                        <td>{r.No}</td>
                        <td>{r.Code_No}</td>
                        <td>{r.Name}</td>
                        <td>{r.Phone_No}</td>
                        <td>{r.Gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && dryRun && (
            <div>
              <div className="ids-summary-grid">
                <div>
                  <span>Total</span>
                  <strong>{dryRun.summary.total}</strong>
                </div>
                <div>
                  <span>New inserts</span>
                  <strong>{dryRun.summary.insert}</strong>
                </div>
                <div>
                  <span>Updates</span>
                  <strong>{dryRun.summary.update}</strong>
                </div>
                <div>
                  <span>Unchanged</span>
                  <strong>{dryRun.summary.skip}</strong>
                </div>
                <div>
                  <span>Errors</span>
                  <strong className={dryRun.errors.length ? "ids-err" : "ids-ok"}>
                    {dryRun.errors.length}
                  </strong>
                </div>
              </div>
              {dryRun.errors.length > 0 && (
                <>
                  <div className="ids-error-list-wrap">
                    <table className="ids-preview-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Field</th>
                          <th>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRun.errors.slice(0, 50).map((e, i) => (
                          <tr key={`${e.row}-${e.field}-${i}`}>
                            <td>{e.row}</td>
                            <td>{e.field}</td>
                            <td>{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {file && (
                    <button
                      type="button"
                      className="reg-toolbar-btn"
                      disabled={errorReport.isPending}
                      onClick={() => errorReport.mutate(file)}
                    >
                      Download error report (.xlsx)
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {step === 4 && dryRun && (
            <div>
              <p className="ids-ok">All rows passed validation.</p>
              <p>
                Ready to import <strong>{dryRun.summary.total}</strong> investors (
                {dryRun.summary.insert} new, {dryRun.summary.update} updates, {dryRun.summary.skip}{" "}
                unchanged).
              </p>
              <p className="ids-schema-footnote">File: {file?.name}</p>
            </div>
          )}
        </div>

        <footer className="ids-wizard__footer">
          {step > 0 && step < 4 && (
            <button type="button" className="reg-toolbar-btn" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {step === 0 && file && !dryRunMutation.isPending && (
            <button type="button" className="reg-toolbar-btn" onClick={() => setStep(1)}>
              Next
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              className="reg-toolbar-btn reg-toolbar-btn--primary"
              disabled={!dryRun?.headerCheck?.ok}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          )}
          {step === 2 && (
            <button type="button" className="reg-toolbar-btn reg-toolbar-btn--primary" onClick={() => setStep(3)}>
              Validate
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              className="reg-toolbar-btn reg-toolbar-btn--primary"
              disabled={!dryRun?.ok}
              onClick={goConfirm}
            >
              Continue to confirm
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              className="reg-toolbar-btn reg-toolbar-btn--primary"
              disabled={commitMutation.isPending}
              onClick={handleCommit}
            >
              {commitMutation.isPending ? "Importing…" : `Import ${dryRun?.summary.total ?? 0} investors`}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
