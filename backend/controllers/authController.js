import adminSchema from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    generateAccessToken,
    generateRefreshToken
} from "../utils/token.js";


export const signupAdmin = async (req, res) => {
    const { email, password } = req.body;
    console.log('===', email, password);
    try {
        const existingUser = await adminSchema.findOne({ email });
        if (existingUser) return res.status(400).json("User already exists");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await adminSchema.create({
            email,
            password: hashedPassword,
            role: "admin"
        });

        res.json(user);
    } catch (err) {
        res.status(500).json(err);
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

export const refreshToken = (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("No refresh token");

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken });
    } catch (err) {
        res.status(403).json("Invalid refresh token");
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