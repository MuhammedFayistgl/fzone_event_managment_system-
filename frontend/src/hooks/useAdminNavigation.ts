import { useMemo } from "react";
import {
  ADMIN_NAV_ITEMS,
  NAV_GROUP_ORDER,
  QUICK_ACTION_PRIORITY,
  type AdminNavItem,
  type NavGroup,
} from "../config/adminNavigation";
import type { PermissionKey } from "../utils/authRole";
import { getRoleFromToken } from "../utils/authRole";
import { useAdminProfile } from "./useAdminProfile";

function canSeeItem(
  item: AdminNavItem,
  role: string | null,
  isSuperAdmin: boolean,
  hasPermission: (key: PermissionKey) => boolean
): boolean {
  if (!role || !item.roles.includes(role)) return false;
  if (isSuperAdmin) return true;
  if (role === "scanner" || role === "finance") return true;
  if (item.permission) return hasPermission(item.permission);
  return true;
}

export function useAdminNavigation() {
  const role = getRoleFromToken();
  const { hasPermission, isSuperAdmin, loading } = useAdminProfile();

  const visibleItems = useMemo(() => {
    return ADMIN_NAV_ITEMS.filter((item) =>
      canSeeItem(item, role, isSuperAdmin, hasPermission)
    );
  }, [role, isSuperAdmin, hasPermission]);

  const visibleGroups = useMemo(() => {
    const grouped = new Map<NavGroup, AdminNavItem[]>();
    for (const group of NAV_GROUP_ORDER) {
      grouped.set(group, []);
    }
    for (const item of visibleItems) {
      grouped.get(item.group)?.push(item);
    }
    return NAV_GROUP_ORDER.map((group) => ({
      group,
      items: grouped.get(group) ?? [],
    })).filter((entry) => entry.items.length > 0);
  }, [visibleItems]);

  const quickActions = useMemo(() => {
    const candidates = visibleItems.filter((item) => item.overviewQuick);
    const priority = role ? QUICK_ACTION_PRIORITY[role] ?? [] : [];
    const sorted = [...candidates].sort((a, b) => {
      const ai = priority.indexOf(a.id);
      const bi = priority.indexOf(b.id);
      const aRank = ai === -1 ? 999 : ai;
      const bRank = bi === -1 ? 999 : bi;
      return aRank - bRank;
    });
    return sorted.slice(0, 3);
  }, [visibleItems, role]);

  return {
    role,
    loading: loading && role === "admin",
    visibleItems,
    visibleGroups,
    quickActions,
  };
}
