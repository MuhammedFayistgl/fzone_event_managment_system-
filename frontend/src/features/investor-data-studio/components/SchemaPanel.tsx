import type { InvestorSchema } from "../types/investorDataStudio.types";
import {
  useInvestorExportDownload,
  useInvestorTemplateDownload,
} from "../hooks/useInvestorDataStudio";

type Props = {
  schema: InvestorSchema | undefined;
  onStartImport: () => void;
  loading?: boolean;
};

export default function SchemaPanel({ schema, onStartImport, loading }: Props) {
  const template = useInvestorTemplateDownload();
  const exportAll = useInvestorExportDownload();

  return (
    <section className="ids-schema-panel">
      <div className="ids-schema-panel__header">
        <div>
          <h2 className="ids-schema-panel__title">Investor database schema</h2>
          <p className="ids-schema-panel__subtitle">
            Excel row 1 must match these column names exactly (case-sensitive).
            UI shows &quot;Code&quot; but the Excel header must be{" "}
            <code>Code_No</code>.
          </p>
        </div>
        <div className="ids-schema-panel__actions">
          <button
            type="button"
            className="reg-toolbar-btn"
            disabled={template.isPending}
            onClick={() => template.mutate()}
          >
            Download template
          </button>
          <button
            type="button"
            className="reg-toolbar-btn"
            disabled={exportAll.isPending}
            onClick={() => exportAll.mutate()}
          >
            Export all (.xlsx)
          </button>
          <button type="button" className="reg-toolbar-btn reg-toolbar-btn--primary" onClick={onStartImport}>
            Import spreadsheet
          </button>
        </div>
      </div>

      <div className="ids-schema-alert">
        <strong>Strict headers:</strong> {schema?.headerContract || "Loading…"}
      </div>

      <div className="ids-schema-table-wrap">
        <table className="ids-schema-table">
          <thead>
            <tr>
              <th>Excel column</th>
              <th>UI label</th>
              <th>Type</th>
              <th>Required</th>
              <th>Example</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {(schema?.fields || []).map((f) => (
              <tr key={f.key}>
                <td>
                  <code>{f.key}</code>
                </td>
                <td>{f.label}</td>
                <td>{f.type}</td>
                <td>{f.required ? "Yes" : "No"}</td>
                <td>{f.example}</td>
                <td>{f.description}</td>
              </tr>
            ))}
            {!schema && !loading && (
              <tr>
                <td colSpan={6}>Schema unavailable</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="ids-schema-footnote">
        Max {schema?.maxRows?.toLocaleString() || "5,000"} rows per import. Any row error cancels the
        entire import — download the error report, fix the sheet, and re-upload.
      </p>
    </section>
  );
}
