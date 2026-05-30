import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import type { PlatformOverview } from "../api/platformOpsApi";
import { formatUptime, statusLabel } from "../utils/formatOps";

const statusIcon = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  maintenance: Wrench,
};

export function StatusHero({ data }: { data?: PlatformOverview }) {
  const status = data?.serverStatus || "ok";
  const Icon = statusIcon[status as keyof typeof statusIcon] || Activity;
  const tone =
    status === "ok"
      ? "pcc-status--ok"
      : status === "maintenance"
        ? "pcc-status--maint"
        : "pcc-status--bad";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`pcc-status-hero ${tone}`}
    >
      <div className="pcc-status-hero__icon">
        <Icon size={28} />
      </div>
      <div>
        <p className="pcc-status-hero__eyebrow">Server status</p>
        <h2 className="pcc-status-hero__title">{statusLabel(status)}</h2>
        <p className="pcc-status-hero__meta">
          Uptime {formatUptime(data?.uptimeSeconds || 0)} · Plan{" "}
          <span className="capitalize">{data?.plan || "free"}</span> ·{" "}
          {data?.connections.onlineNow ?? 0} online now
        </p>
      </div>
      <div className="pcc-status-hero__pill">
        Mongo {data?.mongo.status || "—"} · Redis {data?.redis.status || "—"}
      </div>
    </motion.div>
  );
}
