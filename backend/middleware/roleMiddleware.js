/**
 * Role-based authorization — use after authMiddleware.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const role = req.user.role || "admin";

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
