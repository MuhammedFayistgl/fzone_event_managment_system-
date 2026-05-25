import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import {
  getRoleFromToken,
  hasPermission,
  isSuperAdmin,
  type PermissionKey,
} from "../utils/authRole";

export type AdminProfile = {
  id: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
};

let cachedProfile: AdminProfile | null = null;
let inflight: Promise<AdminProfile | null> | null = null;

async function fetchAdminProfile(): Promise<AdminProfile | null> {
  if (!getRoleFromToken()) return null;
  if (cachedProfile) return cachedProfile;
  if (inflight) return inflight;

  inflight = API.get("/admin/me")
    .then((res) => {
      cachedProfile = res.data?.data || null;
      return cachedProfile;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function clearAdminProfileCache() {
  cachedProfile = null;
  inflight = null;
}

export function useAdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile && Boolean(getRoleFromToken()));

  const reload = useCallback(async () => {
    cachedProfile = null;
    setLoading(true);
    const next = await fetchAdminProfile();
    setProfile(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    if (!getRoleFromToken()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (cachedProfile) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }
    reload();
  }, [reload]);

  const role = profile?.role || getRoleFromToken();
  const permissions = profile?.permissions || [];

  const checkPermission = useCallback(
    (key: PermissionKey) => hasPermission(permissions, key, role),
    [permissions, role]
  );

  return {
    profile,
    loading,
    reload,
    role,
    permissions,
    isSuperAdmin: isSuperAdmin() || role === "super_admin",
    hasPermission: checkPermission,
  };
}

export { fetchAdminProfile };
