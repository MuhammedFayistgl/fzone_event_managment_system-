import bcrypt from "bcryptjs";
import adminSchema from "../models/adminModel.js";
import { logAuditAction } from "../utils/auditLog.js";

const VALID_ROLES = new Set(["admin", "scanner", "finance"]);

function staffSummary(doc) {
  return {
    id: String(doc._id),
    email: doc.email,
    role: doc.role,
    createdAt: doc._id.getTimestamp?.()?.toISOString?.() || null,
  };
}

export async function listStaff(_req, res) {
  try {
    const staff = await adminSchema
      .find({})
      .select("email role")
      .sort({ email: 1 })
      .lean();

    return res.json({
      success: true,
      data: staff.map((doc) => staffSummary(doc)),
    });
  } catch (err) {
    console.error("listStaff error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function createStaff(req, res) {
  const { email, password, role = "admin" } = req.body || {};

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  const normalizedRole = String(role).trim();
  if (!VALID_ROLES.has(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: "Role must be admin, scanner, or finance",
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const existing = await adminSchema.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A staff account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const user = await adminSchema.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
    });

    const actor = await adminSchema.findById(req.user?.id).select("email role").lean();

    await logAuditAction({
      action: "staff.created",
      category: "auth",
      actor: actor
        ? { id: actor._id, email: actor.email, role: actor.role }
        : { id: req.user?.id, role: req.user?.role },
      targetType: "admin",
      targetId: user._id,
      metadata: { email: user.email, role: user.role },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created",
      data: staffSummary(user),
    });
  } catch (err) {
    console.error("createStaff error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
