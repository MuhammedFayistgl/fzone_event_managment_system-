import { NavLink } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import { toggleTheme } from "../redux/store/slices/themeSlice";
import { NAV_GROUP_LABELS } from "../config/adminNavigation";
import { useAdminNavigation } from "../hooks/useAdminNavigation";
import { useAdminLogout } from "../hooks/useAdminLogout";
import logoUrl from "../assets/F-zone logo only_ png.svg";

function sidebarLinkClass(isActive: boolean) {
  return `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`;
}

export default function AdminSidebar() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.theme.mode);
  const { visibleGroups, loading } = useAdminNavigation();
  const { logOut } = useAdminLogout();

  if (loading) {
    return (
      <aside className="admin-sidebar hidden lg:flex" aria-label="Main navigation">
        <div className="admin-sidebar__inner">
          <div className="admin-sidebar__brand">
            <img src={logoUrl} alt="F-Zone" className="admin-sidebar__logo" />
            <span className="admin-sidebar__brand-text">F-Zone</span>
          </div>
          <p className="text-sm text-app-muted px-4 py-6">Loading menu…</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="admin-sidebar hidden lg:flex" aria-label="Main navigation">
      <div className="admin-sidebar__inner">
        <NavLink to="/" className="admin-sidebar__brand" end style={{ textDecoration: "none" }}>
          <img src={logoUrl} alt="F-Zone" className="admin-sidebar__logo" />
          <span className="admin-sidebar__brand-text">F-Zone</span>
        </NavLink>

        <nav className="admin-sidebar__nav">
          {visibleGroups.map(({ group, items }) => (
            <div key={group} className="admin-sidebar__group">
              <p className="admin-sidebar__group-label">{NAV_GROUP_LABELS[group]}</p>
              <ul className="admin-sidebar__list">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => sidebarLinkClass(isActive)}
                        style={{ textDecoration: "none" }}
                      >
                        <Icon className="admin-sidebar__link-icon" strokeWidth={2} aria-hidden />
                        <span className="admin-sidebar__link-label">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className="admin-sidebar__footer-btn"
            title={themeMode === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{themeMode === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button type="button" onClick={logOut} className="admin-sidebar__footer-btn admin-sidebar__footer-btn--danger">
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
