import type { FC } from "react";
import { Avatar } from "rsuite";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { NotificationBell } from "../features/notifications/components/NotificationBell";
import AdminMobileNav, {
  AdminMobileNavToggle,
  useAdminMobileNav,
} from "../layouts/AdminMobileNav";
import { getRoleFromToken } from "../utils/authRole";
import logoUrl from "../assets/F-zone logo only_ png.svg";

interface HeaderProps {}

const Header: FC<HeaderProps> = () => {
  const navigate = useNavigate();
  const { open, openNav, closeNav } = useAdminMobileNav();
  const role = getRoleFromToken();
  const showSettings = role === "super_admin" || role === "admin";

  return (
    <>
      <header className="admin-topbar">
        <div className="admin-topbar__start">
          <AdminMobileNavToggle onClick={openNav} />
          <button
            type="button"
            className="admin-topbar__brand lg:hidden"
            onClick={() => navigate("/")}
            aria-label="Go to overview"
          >
            <Avatar src={logoUrl} circle size="sm" />
          </button>
        </div>

        <div className="admin-topbar__end">
          <NotificationBell />
          {showSettings && (
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="admin-topbar__icon-btn"
              title="Settings"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
        </div>
      </header>

      <AdminMobileNav open={open} onClose={closeNav} />
    </>
  );
};

export default Header;
