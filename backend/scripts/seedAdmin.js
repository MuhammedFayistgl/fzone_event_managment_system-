/**
 * One-time admin bootstrap when ALLOW_ADMIN_SIGNUP=false
 * Run from backend folder: node scripts/seedAdmin.js
 */
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import adminSchema from "../models/adminModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { getSuperAdminEmail } from "../config/permissions.js";

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const superEmail = getSuperAdminEmail();
const isSuperAdmin = email?.trim().toLowerCase() === superEmail;

if (!email || !password) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_SERVER_IP);
const existing = await adminSchema.findOne({ email });

if (existing) {
  console.log("Admin already exists:", email);
  await mongoose.disconnect();
  process.exit(0);
}

const hashed = await bcrypt.hash(password, 10);
await adminSchema.create({
  email,
  password: hashed,
  role: isSuperAdmin ? "super_admin" : "admin",
  status: "active",
  permissions: [],
});
console.log(isSuperAdmin ? "Super admin created:" : "Admin created:", email);
await mongoose.disconnect();
