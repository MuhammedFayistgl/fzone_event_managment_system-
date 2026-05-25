import { normalizePermissions } from "../config/permissions.js";

const VALID_ROLES = new Set(["super_admin", "admin", "scanner", "finance"]);

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const role = req.admin?.role || req.user.role;

    if (!role || !VALID_ROLES.has(role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid or missing role on token",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
}

export function requireAnyRole(...allowedRoles) {
  return requireRole(...allowedRoles);
}

export function requireSuperAdmin() {
  return requireRole("super_admin");
}

/** Active staff: super_admin always; others must be status active */
export function requireActiveStaff() {
  return (req, res, next) => {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (admin.role === "super_admin") {
      return next();
    }

    const status = admin.status || "active";

    if (status !== "active") {
      const message =
        status === "pending"
          ? "Account pending super admin approval"
          : "Account disabled";
      return res.status(403).json({ success: false, message });
    }

    next();
  };
}

/**
 * super_admin bypasses; listed roles bypass (scanner/finance); admin needs permission key.
 */
export function requirePermission(...permissionKeys) {
  return (req, res, next) => {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (admin.role === "super_admin") {
      return next();
    }

    if (admin.status !== "active" && admin.status) {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const perms = normalizePermissions(admin.permissions);
    const allowed = permissionKeys.some((key) => perms.includes(key));
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions for this action",
      });
    }

    next();
  };
}

/**
 * Permission OR role bypass (e.g. scanner can check-in without admin permission keys).
 */
export function requirePermissionOrRole(permissionKey, ...roles) {
  return (req, res, next) => {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (admin.role === "super_admin") {
      return next();
    }

    if (admin.status !== "active" && admin.status) {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    if (roles.includes(admin.role)) {
      return next();
    }

    if (admin.role === "admin") {
      const perms = normalizePermissions(admin.permissions);
      if (perms.includes(permissionKey)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions for this action",
    });
  };
}

export default requireRole;
