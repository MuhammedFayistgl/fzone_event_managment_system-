import type { FC } from "react";
import { FaUsersGear, FaGear } from "react-icons/fa6";
import { useNavigate } from "react-router";
import { getRoleFromToken, type PermissionKey } from "../utils/authRole";
import { useAdminProfile } from "../hooks/useAdminProfile";

type StaffToolItem = {
  label: string;
  path: string;
  roles: string[];
  permission?: PermissionKey;
  hint?: string;
  icon?: typeof FaUsersGear;
};

const StaffTools: FC = () => {
  const navigation = useNavigate();
  const role = getRoleFromToken();
  const { hasPermission, isSuperAdmin, loading } = useAdminProfile();

  const items: StaffToolItem[] = [
    {
      label: "User Management (IDs)",
      path: "/user-management",
      roles: ["super_admin", "admin"],
      permission: "investors:read",
    },
    {
      label: "Investor Data Studio",
      path: "/user-management/data-studio",
      roles: ["super_admin", "admin"],
      permission: "investors:import",
    },
    {
      label: "Gate Scanner App",
      path: "/gate-scanner",
      roles: ["super_admin", "admin", "scanner"],
    },
    {
      label: "Attendance Logs",
      path: "/attendance-logs",
      roles: ["super_admin", "admin", "scanner"],
    },
    {
      label: "Payments & Revenue",
      path: "/payments",
      roles: ["super_admin", "admin", "finance"],
    },
    {
      label: "Finance Reconciliation",
      path: "/finance/reconciliation",
      roles: ["super_admin", "admin", "finance"],
    },
    {
      label: "Audit Log",
      path: "/platform/audit-log",
      roles: ["super_admin", "admin"],
      permission: "audit:read",
    },
    {
      label: "Webhook Deliveries",
      path: "/platform/webhooks",
      roles: ["super_admin", "admin"],
      permission: "audit:read",
    },
    {
      label: "Create Event",
      path: "/event",
      hint: "Includes ticket background design",
      roles: ["super_admin", "admin"],
      permission: "events:write",
    },
    {
      label: "Settings",
      path: "/settings",
      icon: FaGear,
      roles: ["super_admin", "admin"],
      permission: "settings:write",
    },
  ];

  const visibleItems = items.filter((item) => {
    if (!role || !item.roles.includes(role)) return false;
    if (isSuperAdmin) return true;
    if (role === "scanner" || role === "finance") return true;
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  if (loading && role === "admin") {
    return (
      <div className="w-full text-sm text-app-muted py-4">Loading staff tools…</div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-app-surface-muted border border-app-border">
          <FaUsersGear className="text-app-text text-lg" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-app-text">Staff Tools</h2>
          <p className="text-xs text-app-muted">Manage staff operations efficiently</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-app-border">
        {visibleItems.map((item) => {
          const Icon = item.icon || FaUsersGear;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigation(item.path)}
              className="flex items-center justify-between py-3 px-2 hover:bg-[var(--color-card-hover)] transition group"
            >
              <div className="flex items-center gap-3">
                <Icon className="text-app-muted group-hover:text-app-accent transition" />
                <div className="text-left">
                  <span className="text-sm font-medium text-app-text block">
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="text-xs text-app-muted">{item.hint}</span>
                  )}
                </div>
              </div>
              <span className="text-app-muted group-hover:text-app-accent">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StaffTools;
