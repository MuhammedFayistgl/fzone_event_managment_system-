import { getOrgSettings } from "../utils/appSettings.js";

export async function maintenanceGuard(req, res, next) {
  try {
    const settings = await getOrgSettings();
    const platform = settings.platform || {};
    if (!platform.maintenanceMode) {
      return next();
    }

    const isAdminRoute =
      req.path.startsWith("/admin") ||
      req.originalUrl.includes("/admin/");

    if (isAdminRoute) {
      return next();
    }

    return res.status(503).json({
      success: false,
      code: "MAINTENANCE_MODE",
      message:
        platform.maintenanceMessage ||
        "Platform is under maintenance. Please try again later.",
    });
  } catch (err) {
    return next(err);
  }
}

export async function getMaintenanceStatus() {
  const settings = await getOrgSettings();
  const platform = settings.platform || {};
  return {
    maintenanceMode: Boolean(platform.maintenanceMode),
    maintenanceMessage: platform.maintenanceMessage || "",
  };
}
