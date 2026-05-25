/**
 * Role-based authorization — use after authMiddleware.
 * Fail closed: missing or unknown role is denied.
 */
const VALID_ROLES = new Set(["admin", "scanner", "finance"]);

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const role = req.user.role;

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

export default requireRole;
