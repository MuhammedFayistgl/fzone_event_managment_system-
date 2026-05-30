import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer } from "rsuite";
import { ChevronRight, Moon, Sun, LogOut, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import { toggleTheme } from "../redux/store/slices/themeSlice";
import { NAV_GROUP_LABELS, isNavItemActive } from "../config/adminNavigation";
import { useAdminNavigation } from "../hooks/useAdminNavigation";
import { useAdminLogout } from "../hooks/useAdminLogout";
import logoUrl from "../assets/F-zone logo only_ png.svg";

type AdminMobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export default function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.theme.mode);
  const { visibleGroups, loading } = useAdminNavigation();
  const { logOut } = useAdminLogout();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      size="xs"
      closeButton={false}
      className="admin-mobile-nav"
    >
      <Drawer.Header className="admin-mobile-nav__header">
        <div className="admin-mobile-nav__header-row">
          <div className="admin-mobile-nav__brand">
            <span className="admin-mobile-nav__logo-wrap" aria-hidden>
              <img src={logoUrl} alt="" className="admin-mobile-nav__logo" />
            </span>
            <div className="admin-mobile-nav__brand-copy">
              <span className="admin-mobile-nav__brand-title">F-Zone</span>
              <span className="admin-mobile-nav__brand-sub">Admin workspace</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-mobile-nav__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      </Drawer.Header>
      <Drawer.Body className="admin-mobile-nav__body">
        {loading ? (
          <div className="admin-mobile-nav__loading" aria-busy="true">
            <span className="admin-mobile-nav__loading-bar" />
            <span className="admin-mobile-nav__loading-bar admin-mobile-nav__loading-bar--short" />
            <span className="admin-mobile-nav__loading-bar" />
          </div>
        ) : (
          <nav className="admin-mobile-nav__groups" aria-label="Mobile navigation">
            {visibleGroups.map(({ group, items }) => (
              <div key={group} className="admin-mobile-nav__group">
                <p className="admin-mobile-nav__group-label">{NAV_GROUP_LABELS[group]}</p>
                <ul className="admin-mobile-nav__list">
                  {items.map((item) => {
                    const active = isNavItemActive(location.pathname, item);
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`admin-mobile-nav__link${active ? " admin-mobile-nav__link--active" : ""}`}
                          onClick={() => goTo(item.path)}
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="admin-mobile-nav__icon-well" aria-hidden>
                            <Icon className="admin-mobile-nav__icon" strokeWidth={2} />
                          </span>
                          <span className="admin-mobile-nav__link-label">{item.label}</span>
                          {active && (
                            <ChevronRight className="admin-mobile-nav__chevron" size={16} aria-hidden />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        )}

        <div className="admin-mobile-nav__actions">
          <button
            type="button"
            className="admin-mobile-nav__action"
            onClick={() => dispatch(toggleTheme())}
          >
            <span className="admin-mobile-nav__icon-well admin-mobile-nav__icon-well--muted" aria-hidden>
              {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            {themeMode === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            className="admin-mobile-nav__action admin-mobile-nav__action--danger"
            onClick={() => {
              onClose();
              logOut();
            }}
          >
            <span className="admin-mobile-nav__icon-well admin-mobile-nav__icon-well--danger" aria-hidden>
              <LogOut size={18} />
            </span>
            Sign out
          </button>
        </div>
      </Drawer.Body>
    </Drawer>
  );
}

/** Hamburger toggle button for mobile header */
export function AdminMobileNavToggle({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="admin-mobile-nav-toggle lg:hidden"
      onClick={onClick}
      aria-label="Open navigation menu"
    >
      <span className="admin-mobile-nav-toggle__bar" />
      <span className="admin-mobile-nav-toggle__bar" />
      <span className="admin-mobile-nav-toggle__bar" />
    </button>
  );
}

export function useAdminMobileNav() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openNav: () => setOpen(true),
    closeNav: () => setOpen(false),
  };
}
