import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  ScanLine,
  BadgeCheck,
  Users,
  Database,
  Wallet,
  Scale,
  ScrollText,
  Webhook,
  Bell,
  Settings,
} from "lucide-react";
import type { PermissionKey } from "../utils/authRole";

export type NavGroup = "operations" | "people" | "finance" | "platform" | "system";

export type AdminNavItem = {
  id: string;
  label: string;
  path: string;
  group: NavGroup;
  roles: string[];
  permission?: PermissionKey;
  icon: LucideIcon;
  overviewQuick?: boolean;
  hint?: string;
  /** Match child routes (e.g. /user-management/data-studio under /user-management) */
  exact?: boolean;
};

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  operations: "Operations",
  people: "People",
  finance: "Finance",
  platform: "Platform",
  system: "System",
};

export const NAV_GROUP_ORDER: NavGroup[] = [
  "operations",
  "people",
  "finance",
  "platform",
  "system",
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    path: "/",
    group: "operations",
    roles: ["super_admin", "admin", "scanner", "finance"],
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "create-event",
    label: "Create Event",
    path: "/event",
    group: "operations",
    roles: ["super_admin", "admin"],
    permission: "events:write",
    icon: CalendarPlus,
    overviewQuick: true,
    hint: "Includes ticket background design",
  },
  {
    id: "all-registrations",
    label: "All Registrations",
    path: "/allregistrations",
    group: "operations",
    roles: ["super_admin", "admin", "scanner", "finance"],
    icon: ClipboardList,
    overviewQuick: true,
  },
  {
    id: "gate-scanner",
    label: "Gate Scanner",
    path: "/gate-scanner",
    group: "operations",
    roles: ["super_admin", "admin", "scanner"],
    icon: ScanLine,
    overviewQuick: true,
  },
  {
    id: "attendance-logs",
    label: "Attendance Logs",
    path: "/attendance-logs",
    group: "operations",
    roles: ["super_admin", "admin", "scanner"],
    icon: BadgeCheck,
    overviewQuick: true,
  },
  {
    id: "user-management",
    label: "User Management",
    path: "/user-management",
    group: "people",
    roles: ["super_admin", "admin"],
    permission: "investors:read",
    icon: Users,
    overviewQuick: true,
  },
  {
    id: "investor-data-studio",
    label: "Investor Data Studio",
    path: "/user-management/data-studio",
    group: "people",
    roles: ["super_admin", "admin"],
    permission: "investors:import",
    icon: Database,
  },
  {
    id: "payments",
    label: "Payments & Revenue",
    path: "/payments",
    group: "finance",
    roles: ["super_admin", "admin", "finance"],
    icon: Wallet,
    overviewQuick: true,
  },
  {
    id: "finance-reconciliation",
    label: "Finance Reconciliation",
    path: "/finance/reconciliation",
    group: "finance",
    roles: ["super_admin", "admin", "finance"],
    icon: Scale,
    overviewQuick: true,
  },
  {
    id: "audit-log",
    label: "Audit Log",
    path: "/platform/audit-log",
    group: "platform",
    roles: ["super_admin", "admin"],
    permission: "audit:read",
    icon: ScrollText,
  },
  {
    id: "webhooks",
    label: "Webhook Deliveries",
    path: "/platform/webhooks",
    group: "platform",
    roles: ["super_admin", "admin"],
    permission: "audit:read",
    icon: Webhook,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/notifications",
    group: "system",
    roles: ["super_admin", "admin", "scanner", "finance"],
    icon: Bell,
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    group: "system",
    roles: ["super_admin", "admin"],
    permission: "settings:write",
    icon: Settings,
  },
];

/** Role-specific quick action priority when more than 3 items qualify */
export const QUICK_ACTION_PRIORITY: Record<string, string[]> = {
  super_admin: ["create-event", "user-management", "gate-scanner"],
  admin: ["create-event", "user-management", "gate-scanner"],
  scanner: ["gate-scanner", "attendance-logs", "all-registrations"],
  finance: ["payments", "finance-reconciliation", "all-registrations"],
};

export function isNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) {
    return pathname === item.path;
  }
  if (item.path === "/") {
    return pathname === "/";
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
