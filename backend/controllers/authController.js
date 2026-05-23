import adminSchema from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    generateAccessToken,
    generateRefreshToken
} from "../utils/token.js";


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

    try {
        const existingUser = await adminSchema.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await adminSchema.create({
            email,
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

    const user = await adminSchema.findOne({ email });
    if (!user) return res.status(400).json("User not found ");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Wrong password");

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        accessToken,
        role: user.role
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

        const accessToken = jwt.sign(
            {
                id: decoded.id,
                role: user?.role || "admin",
            },
            process.env.ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({
            accessToken,
            role: user?.role || "admin",
        });
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie("refreshToken");
    res.json("Logged out");
};

// export const profile = async (req, res) => {
//     const user = await User.findById(req.user.id);
//     res.json(user);
// };