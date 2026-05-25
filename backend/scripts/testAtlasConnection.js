/**
 * Test MongoDB Atlas connection.
 * Usage: MONGODB_ATLAS_URI=... npm run test:atlas
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const uri =
  process.env.MONGODB_ATLAS_URI ||
  process.env.MONGODB_SERVER_IP;

if (!uri || uri.includes("<db_password>")) {
  console.error("Set MONGODB_ATLAS_URI or MONGODB_SERVER_IP to your Atlas connection string.");
  process.exit(1);
}

await mongoose.connect(uri);
const collections = await mongoose.connection.db.listCollections().toArray();
console.log("Atlas connection OK");
console.log("Database:", mongoose.connection.name);
console.log(
  "Collections:",
  collections.map((c) => c.name).join(", ") || "(none)"
);
await mongoose.disconnect();
