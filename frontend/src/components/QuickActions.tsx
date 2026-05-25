import { useNavigate } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { useAdminNavigation } from "../hooks/useAdminNavigation";

export default function QuickActions() {
  const navigate = useNavigate();
  const { quickActions, loading } = useAdminNavigation();

  if (loading) {
    return (
      <div className="quick-actions">
        <p className="text-sm text-app-muted">Loading shortcuts…</p>
      </div>
    );
  }

  if (quickActions.length === 0) return null;

  return (
    <section className="quick-actions" aria-label="Quick actions">
      <div className="quick-actions__head">
        <h2 className="quick-actions__title">Quick actions</h2>
        <p className="quick-actions__subtitle">Shortcuts — full menu in the sidebar</p>
      </div>
      <div className="quick-actions__grid">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="quick-actions__card"
              onClick={() => navigate(item.path)}
            >
              <div className="quick-actions__card-icon">
                <Icon size={20} strokeWidth={2} aria-hidden />
              </div>
              <div className="quick-actions__card-body">
                <span className="quick-actions__card-label">{item.label}</span>
                {item.hint && (
                  <span className="quick-actions__card-hint">{item.hint}</span>
                )}
              </div>
              <ArrowUpRight className="quick-actions__card-arrow" size={16} aria-hidden />
            </button>
          );
        })}
      </div>
    </section>
  );
}
