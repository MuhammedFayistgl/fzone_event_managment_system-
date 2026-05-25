import bcrypt from "bcryptjs";
import adminSchema from "../models/adminModel.js";
import { logAuditAction } from "../utils/auditLog.js";
import {
  PERMISSION_CATALOG,
  getSuperAdminEmail,
  normalizePermissions,
} from "../config/permissions.js";
import { getActorFromRequest } from "../utils/adminActor.js";

const STAFF_ROLES = new Set(["admin", "scanner", "finance"]);

function staffSummary(doc) {
  return {
    id: String(doc._id),
    email: doc.email,
    role: doc.role,
    status: doc.status || "active",
    permissions: doc.permissions || [],
    activatedAt: doc.activatedAt?.toISOString?.() || null,
    createdAt: doc._id.getTimestamp?.()?.toISOString?.() || null,
  };
}

export async function getAdminProfile(req, res) {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    return res.json({
      success: true,
      data: {
        id: String(admin._id),
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: normalizePermissions(admin.permissions),
      },
    });
  } catch (err) {
    console.error("getAdminProfile error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function getPermissionsCatalog(_req, res) {
  return res.json({
    success: true,
    data: PERMISSION_CATALOG,
  });
}

export async function listStaff(_req, res) {
  try {
    const staff = await adminSchema
      .find({ role: { $ne: "super_admin" } })
      .select("email role status permissions activatedAt")
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
  if (!STAFF_ROLES.has(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: "Role must be admin, scanner, or finance",
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail === getSuperAdminEmail()) {
    return res.status(400).json({
      success: false,
      message: "This email is reserved for the platform super admin",
    });
  }

  try {
    const existing = await adminSchema.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A staff account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const isAdminRole = normalizedRole === "admin";
    const user = await adminSchema.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      status: isAdminRole ? "pending" : "active",
      permissions: [],
    });

    const actor = getActorFromRequest(req);

    await logAuditAction({
      action: "staff.created",
      category: "auth",
      actor,
      targetType: "admin",
      targetId: user._id,
      metadata: { email: user.email, role: user.role, status: user.status },
      req,
    });

    return res.status(201).json({
      success: true,
      message: isAdminRole
        ? "Staff account created — pending activation"
        : "Staff account created",
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

export async function activateStaff(req, res) {
  const { permissions = [] } = req.body || {};
  const targetId = req.params.id;

  try {
    const target = await adminSchema.findById(targetId);
    if (!target || target.role === "super_admin") {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    if (target.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Only admin accounts require activation with permissions",
      });
    }

    const normalizedPerms = normalizePermissions(permissions);
    target.status = "active";
    target.permissions = normalizedPerms;
    target.activatedAt = new Date();
    target.activatedBy = req.admin._id;
    await target.save();

    const actor = getActorFromRequest(req);

    await logAuditAction({
      action: "staff.activated",
      category: "auth",
      actor,
      targetType: "admin",
      targetId: target._id,
      metadata: { email: target.email, permissions: normalizedPerms },
      req,
    });

    return res.json({
      success: true,
      message: "Staff account activated",
      data: staffSummary(target),
    });
  } catch (err) {
    console.error("activateStaff error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function disableStaff(req, res) {
  const targetId = req.params.id;

  try {
    const target = await adminSchema.findById(targetId);
    if (!target || target.role === "super_admin") {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    if (target.email === getSuperAdminEmail()) {
      return res.status(403).json({
        success: false,
        message: "Super admin account cannot be disabled",
      });
    }

    target.status = "disabled";
    await target.save();

    const actor = getActorFromRequest(req);

    await logAuditAction({
      action: "staff.disabled",
      category: "auth",
      actor,
      targetType: "admin",
      targetId: target._id,
      metadata: { email: target.email },
      req,
    });

    return res.json({
      success: true,
      message: "Staff account disabled",
      data: staffSummary(target),
    });
  } catch (err) {
    console.error("disableStaff error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function updateStaffPermissions(req, res) {
  const { permissions = [] } = req.body || {};
  const targetId = req.params.id;

  try {
    const target = await adminSchema.findById(targetId);
    if (!target || target.role === "super_admin") {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    if (target.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Permissions apply only to admin accounts",
      });
    }

    const normalizedPerms = normalizePermissions(permissions);
    target.permissions = normalizedPerms;
    await target.save();

    const actor = getActorFromRequest(req);

    await logAuditAction({
      action: "staff.permissions_updated",
      category: "auth",
      actor,
      targetType: "admin",
      targetId: target._id,
      metadata: { email: target.email, permissions: normalizedPerms },
      req,
    });

    return res.json({
      success: true,
      message: "Permissions updated",
      data: staffSummary(target),
    });
  } catch (err) {
    console.error("updateStaffPermissions error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
