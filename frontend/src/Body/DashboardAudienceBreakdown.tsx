import { useState, type CSSProperties } from "react";
import { useSelector } from "react-redux";
import { ChevronDown, Users, UserRound } from "lucide-react";
import type { DashboardSummary } from "../redux/store/slices/summarySlice";

const ACCENT_STYLES: Record<string, { accent: string; soft: string; border: string }> = {
  maleInvestor: {
    accent: "#22d3ee",
    soft: "rgba(34, 211, 238, 0.14)",
    border: "rgba(34, 211, 238, 0.28)",
  },
  femaleInvestor: {
    accent: "#f472b6",
    soft: "rgba(244, 114, 182, 0.14)",
    border: "rgba(244, 114, 182, 0.28)",
  },
  maleGuest: {
    accent: "#38bdf8",
    soft: "rgba(56, 189, 248, 0.14)",
    border: "rgba(56, 189, 248, 0.28)",
  },
  femaleGuest: {
    accent: "#fb7185",
    soft: "rgba(251, 113, 133, 0.14)",
    border: "rgba(251, 113, 133, 0.28)",
  },
};

function BreakdownChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof ACCENT_STYLES;
}) {
  const style = ACCENT_STYLES[tone];

  return (
    <div
      className="overview-audience-chip"
      style={
        {
          "--kpi-accent": style.accent,
          "--kpi-accent-soft": style.soft,
          "--kpi-accent-border": style.border,
        } as CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="overview-audience-chip__label">{label}</p>
          <p className="overview-audience-chip__value">{value.toLocaleString()}</p>
        </div>
        <div
          className="overview-kpi-card__icon-wrap"
          style={
            {
              "--kpi-accent": style.accent,
              "--kpi-accent-soft": style.soft,
              "--kpi-accent-border": style.border,
            } as CSSProperties
          }
          aria-hidden
        >
          <UserRound className="w-5 h-5" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardAudienceBreakdown() {
  const [open, setOpen] = useState(false);
  const summary = useSelector(
    (state: { summary: { totalInvestorsCount: DashboardSummary } }) =>
      state.summary.totalInvestorsCount
  );

  const items = [
    { label: "Male Investors", value: summary.maleCount ?? 0, tone: "maleInvestor" as const },
    { label: "Female Investors", value: summary.femaleCount ?? 0, tone: "femaleInvestor" as const },
    { label: "Male Guests", value: summary.guestMaleCount ?? 0, tone: "maleGuest" as const },
    { label: "Female Guests", value: summary.guestFemaleCount ?? 0, tone: "femaleGuest" as const },
  ];

  const totalAudience =
    (summary.maleCount ?? 0) +
    (summary.femaleCount ?? 0) +
    (summary.guestMaleCount ?? 0) +
    (summary.guestFemaleCount ?? 0);

  return (
    <section className="overview-audience-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="overview-audience-toggle flex items-center justify-between gap-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="overview-kpi-card__icon-wrap"
            style={
              {
                "--kpi-accent": "#a78bfa",
                "--kpi-accent-soft": "rgba(167, 139, 250, 0.14)",
                "--kpi-accent-border": "rgba(167, 139, 250, 0.28)",
              } as CSSProperties
            }
            aria-hidden
          >
            <Users className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="overview-audience-toggle__title">Audience breakdown</p>
            <p className="overview-audience-toggle__desc">
              Gender split across investor database and registered guests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="overview-audience-toggle__meta">{totalAudience.toLocaleString()} total</span>
          <ChevronDown
            className={`w-5 h-5 text-app-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {items.map((item) => (
            <BreakdownChip key={item.label} {...item} />
          ))}
        </div>
      )}
    </section>
  );
}
