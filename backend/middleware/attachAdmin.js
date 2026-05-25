import adminSchema from "../models/adminModel.js";

async function attachAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const admin = await adminSchema.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("attachAdmin error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export default attachAdmin;
