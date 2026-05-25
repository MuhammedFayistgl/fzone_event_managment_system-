import adminSchema from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    generateAccessToken,
    generateRefreshToken
} from "../utils/token.js";
import { cookieOptions } from "../config/env.js";
import { logAuditAction } from "../utils/auditLog.js";
import { createNotification } from "../services/notificationService.js";


export const signupAdmin = async (req, res) => {
    if (process.env.ALLOW_ADMIN_SIGNUP !== "true") {
        return res.status(403).json({
            success: false,
            message: "Admin signup is disabled. Contact a system administrator.",
        });
    }

    const { email, password } = req.body;

    if (!email || !password) {
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

    try {
        const existingUser = await adminSchema.findOne({ email: String(email).trim().toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await adminSchema.create({
            email: String(email).trim().toLowerCase(),
            password: hashedPassword,
            role: "admin",
        });

        return res.status(201).json({
            success: true,
            message: "Admin created",
            data: { id: user._id, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        });
    }

    const user = await adminSchema.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
        await logAuditAction({
            action: "auth.login_failed",
            category: "auth",
            metadata: { email: String(email).trim().toLowerCase(), reason: "unknown_user" },
            req,
        });
        createNotification("auth.login_failed", {
            email: String(email).trim().toLowerCase(),
            reason: "unknown_user",
        }).catch(() => {});
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        await logAuditAction({
            action: "auth.login_failed",
            category: "auth",
            metadata: { email: user.email, reason: "invalid_password" },
            req,
        });
        createNotification("auth.login_failed", {
            email: user.email,
            reason: "invalid_password",
        }).catch(() => {});
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }

    if (!user.role) {
        return res.status(403).json({
            success: false,
            message: "Account has no assigned role",
        });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    await logAuditAction({
        action: "auth.login",
        category: "auth",
        actor: { id: user._id, email: user.email, role: user.role },
        req,
    });

    createNotification("auth.login", {
        adminId: String(user._id),
        email: user.email,
        sender: { actorType: "admin", actorId: String(user._id), actorEmail: user.email },
    }).catch(() => {});

    res.json({
        success: true,
        accessToken,
        role: user.role,
    });
};

export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No refresh token",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
        const user = await adminSchema.findById(decoded.id).select("role");

        if (!user?.role) {
            return res.status(403).json({
                success: false,
                message: "Account has no assigned role",
            });
        }

        const accessToken = jwt.sign(
            {
                id: decoded.id,
                role: user.role,
            },
            process.env.ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({
            success: true,
            accessToken,
            role: user.role,
        });
    } catch {
        return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
};

export const logout = async (req, res) => {
    await logAuditAction({
        action: "auth.logout",
        category: "auth",
        actor: req.user || null,
        req,
    });
    res.clearCookie("refreshToken", cookieOptions(0));
    res.json({ success: true, message: "Logged out" });
};
