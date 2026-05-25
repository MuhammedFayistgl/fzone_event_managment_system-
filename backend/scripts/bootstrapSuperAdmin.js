/**
 * Bootstrap single super admin and activate existing staff (one-time).
 *
 * Usage (from backend/):
 *   npm run bootstrap:super-admin
 *
 * Env:
 *   SUPER_ADMIN_EMAIL=fzone@gmail.com
 *   SEED_ADMIN_PASSWORD=...  (optional — reset super admin password)
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import adminSchema from "../models/adminModel.js";
import { getSuperAdminEmail } from "../config/permissions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const email = getSuperAdminEmail();
const newPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

await mongoose.connect(process.env.MONGODB_SERVER_IP);

await adminSchema.updateMany(
  { status: { $exists: false } },
  { $set: { status: "active", permissions: [] } }
);

let superAdmin = await adminSchema.findOne({ email });

if (!superAdmin) {
  if (!newPassword) {
    console.error("Super admin not found. Set SEED_ADMIN_PASSWORD to create one.");
    process.exit(1);
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  superAdmin = await adminSchema.create({
    email,
    password: hashed,
    role: "super_admin",
    status: "active",
    permissions: [],
  });
  console.log("Created super admin:", email);
} else {
  const update = {
    role: "super_admin",
    status: "active",
    permissions: [],
  };
  if (newPassword) {
    update.password = await bcrypt.hash(newPassword, 12);
    console.log("Super admin password updated");
  }
  await adminSchema.updateOne({ _id: superAdmin._id }, { $set: update });
  console.log("Promoted to super_admin:", email);
}

await mongoose.disconnect();
