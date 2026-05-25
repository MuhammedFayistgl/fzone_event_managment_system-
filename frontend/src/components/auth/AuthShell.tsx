import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, CalendarDays, Users, QrCode, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { toggleTheme } from "../../redux/store/slices/themeSlice";
import logoUrl from "../../assets/F-zone logo only_ png.svg";

type AuthMode = "login" | "signup";

type AuthShellProps = {
  mode: AuthMode;
  title: string;
  subtitle: string;
  eyebrow: string;
  error?: string | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: ReactNode;
};

const FEATURES = [
  { icon: CalendarDays, label: "Event lifecycle & registrations" },
  { icon: Users, label: "Investor Data Studio" },
  { icon: QrCode, label: "Live check-in & QR scanning" },
];

export default function AuthShell({
  mode,
  title,
  subtitle,
  eyebrow,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}: AuthShellProps) {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.theme.mode);
  const isDark = themeMode === "dark";

  return (
    <div className="auth-shell app-page">
      <div className="app-mesh-bg app-mesh-bg--animated" aria-hidden />
      <div className="auth-shell__theme-toggle">
        <button
          type="button"
          className="auth-shell__theme-btn"
          onClick={() => dispatch(toggleTheme())}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-shell__grid">
        <aside className="auth-shell__brand" aria-hidden={false}>
          <div className="auth-shell__brand-inner">
            <div className="auth-shell__logo-wrap">
              <img src={logoUrl} alt="F-Zone" className="auth-shell__logo" />
            </div>
            <p className="auth-shell__brand-eyebrow">F-Zone World Projects</p>
            <h1 className="auth-shell__brand-title">
              Event &amp; Investor Operations Platform
            </h1>
            <p className="auth-shell__brand-subtitle">
              Manage events, investors, payments, and live attendance from one
              secure admin workspace.
            </p>
            <ul className="auth-shell__features">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="auth-shell__feature">
                  <span className="auth-shell__feature-icon">
                    <Icon size={16} strokeWidth={2.25} />
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="auth-shell__main">
          <div className="auth-shell__mobile-brand">
            <img src={logoUrl} alt="F-Zone" className="auth-shell__mobile-logo" />
            <span className="auth-shell__mobile-name">F-Zone Admin</span>
          </div>

          <div className="auth-shell__card app-card-raised">
            <span className="app-page-eyebrow auth-shell__eyebrow">{eyebrow}</span>
            <h2 className="auth-shell__title">{title}</h2>
            <p className="auth-shell__subtitle">{subtitle}</p>

            {success && (
              <div className="auth-shell__alert auth-shell__alert--success" role="status">
                <span>{success}</span>
                {onDismissSuccess && (
                  <button
                    type="button"
                    className="auth-shell__alert-dismiss"
                    onClick={onDismissSuccess}
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="auth-shell__alert auth-shell__alert--error" role="alert">
                <span>{error}</span>
                {onDismissError && (
                  <button
                    type="button"
                    className="auth-shell__alert-dismiss"
                    onClick={onDismissError}
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            <div className="auth-shell__form">{children}</div>

            <p className="auth-shell__footer">
              {mode === "login" ? (
                <>
                  Need an account?{" "}
                  <Link to="/signup" className="auth-shell__link">
                    Create staff account
                  </Link>
                </>
              ) : (
                <>
                  Already have access?{" "}
                  <Link to="/login" className="auth-shell__link">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>

          <p className="auth-shell__legal">
            Secure staff access · Authorized personnel only
          </p>
        </main>
      </div>
    </div>
  );
}
