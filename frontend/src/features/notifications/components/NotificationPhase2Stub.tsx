import { Bell, Mail, BarChart3, Volume2 } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";

export function NotificationPhase2Stub() {
  const soundEnabled = useNotificationStore((s) => s.soundEnabled);
  const setSoundEnabled = useNotificationStore((s) => s.setSoundEnabled);

  return (
    <section className="app-card p-5 space-y-4 opacity-90">
      <div className="flex items-center gap-2">
        <Bell size={18} className="text-app-accent" />
        <h2 className="text-lg font-semibold">Notification preferences</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-app-surface-muted text-app-muted">
          Phase 2
        </span>
      </div>
      <p className="text-sm text-app-muted">
        Email digests, browser push, per-category controls, and delivery analytics ship in the
        next phase. In-app real-time alerts are active now.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="app-card-flat p-4 flex items-start gap-3">
          <Mail size={16} className="text-app-muted mt-0.5" />
          <div>
            <p className="text-sm font-medium">Email delivery</p>
            <p className="text-xs text-app-muted">Category-based SMTP routing</p>
          </div>
        </div>
        <div className="app-card-flat p-4 flex items-start gap-3">
          <BarChart3 size={16} className="text-app-muted mt-0.5" />
          <div>
            <p className="text-sm font-medium">Analytics</p>
            <p className="text-xs text-app-muted">Read rates & action conversion</p>
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
        <Volume2 size={14} />
        Play sound for critical & urgent in-app alerts
      </label>
    </section>
  );
}
