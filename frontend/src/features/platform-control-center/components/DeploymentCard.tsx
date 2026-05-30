import { GitBranch, Globe, Server } from "lucide-react";
import type { PlatformOverview } from "../api/platformOpsApi";

export function DeploymentCard({ data }: { data?: PlatformOverview }) {
  const d = data?.deployment;
  if (!d) return null;

  const shortCommit = d.gitCommit ? d.gitCommit.slice(0, 7) : "—";

  return (
    <div className="pcc-deploy-card app-card">
      <h3 className="pcc-panel-title">Deployment & hosting</h3>
      <div className="pcc-deploy-grid">
        <div>
          <Server size={16} />
          <span className="pcc-deploy-label">Service</span>
          <strong>{d.serviceName}</strong>
        </div>
        <div>
          <Globe size={16} />
          <span className="pcc-deploy-label">Environment</span>
          <strong className="capitalize">{d.environment}</strong>
        </div>
        <div>
          <GitBranch size={16} />
          <span className="pcc-deploy-label">Git commit</span>
          <strong>{shortCommit}</strong>
        </div>
        <div>
          <span className="pcc-deploy-label">Branch</span>
          <strong>{d.gitBranch || "—"}</strong>
        </div>
        <div>
          <span className="pcc-deploy-label">Node</span>
          <strong>{d.nodeVersion}</strong>
        </div>
        <div>
          <span className="pcc-deploy-label">Host</span>
          <strong>{d.hostname}</strong>
        </div>
      </div>
      {d.deploymentId && (
        <p className="pcc-deploy-meta">Deploy ID: {d.deploymentId}</p>
      )}
    </div>
  );
}
