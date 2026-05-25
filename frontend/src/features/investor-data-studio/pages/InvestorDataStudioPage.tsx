import { useState } from "react";
import { Link } from "react-router-dom";
import AppPageLayout from "../../../layouts/AppPageLayout";
import SchemaPanel from "../components/SchemaPanel";
import ImportWizard from "../components/ImportWizard";
import {
  useInvestorImportHistory,
  useInvestorSchema,
} from "../hooks/useInvestorDataStudio";
import "../investor-data-studio.css";

export default function InvestorDataStudioPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data: schema, isLoading } = useInvestorSchema();
  const { data: history, refetch: refetchHistory } = useInvestorImportHistory();

  return (
    <AppPageLayout
      title="Investor Data Studio"
      subtitle="Manage investor database schema, templates, and bulk import without leaving the app."
    >
      <div className="ids-page">
        <nav className="ids-breadcrumb">
          <Link to="/user-management">User Management</Link>
          <span>/</span>
          <span>Data Studio</span>
        </nav>

        <SchemaPanel
          schema={schema}
          loading={isLoading}
          onStartImport={() => setWizardOpen(true)}
        />

        <section className="ids-history">
          <h3>Recent imports</h3>
          {!history?.length && <p className="ids-muted">No imports yet.</p>}
          {!!history?.length && (
            <div className="ids-history-table-wrap">
              <table className="ids-schema-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Inserted</th>
                    <th>Updated</th>
                    <th>Skipped</th>
                    <th>Errors</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job._id}>
                      <td>{new Date(job.createdAt).toLocaleString()}</td>
                      <td>{job.fileName}</td>
                      <td>{job.status}</td>
                      <td>{job.counts.inserted}</td>
                      <td>{job.counts.updated}</td>
                      <td>{job.counts.skipped}</td>
                      <td>{job.errorCount}</td>
                      <td>{job.adminEmail || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ImportWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => refetchHistory()}
      />
    </AppPageLayout>
  );
}
