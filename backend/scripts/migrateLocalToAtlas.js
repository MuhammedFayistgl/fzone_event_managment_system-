/**
 * Copy all collections from local MongoDB to MongoDB Atlas.
 *
 * Usage (from backend/):
 *   set MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.../fzone
 *   npm run migrate:atlas
 *
 * Optional:
 *   MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/fzone  (default)
 *   MONGODB_ATLAS_URI=...                               (required)
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const LOCAL_URI =
  process.env.MONGODB_LOCAL_URI ||
  process.env.MONGODB_SERVER_IP ||
  "mongodb://127.0.0.1:27017/fzone";

const ATLAS_URI = process.env.MONGODB_ATLAS_URI;

if (!ATLAS_URI) {
  console.error(
    "Set MONGODB_ATLAS_URI before running.\n" +
      "Example: mongodb+srv://user:pass@cluster0.e2loh6w.mongodb.net/fzone?appName=Cluster0"
  );
  process.exit(1);
}

if (ATLAS_URI.includes("<db_password>")) {
  console.error("Replace <db_password> in MONGODB_ATLAS_URI with your real Atlas password.");
  process.exit(1);
}

async function copyCollection(localDb, atlasDb, name) {
  const docs = await localDb.collection(name).find({}).toArray();
  if (!docs.length) {
    console.log(`  skip ${name} (empty)`);
    return 0;
  }
  await atlasDb.collection(name).deleteMany({});
  await atlasDb.collection(name).insertMany(docs, { ordered: false });
  console.log(`  copied ${name}: ${docs.length} docs`);
  return docs.length;
}

async function main() {
  console.log("Local:", LOCAL_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"));
  console.log("Atlas:", ATLAS_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"));

  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();

  const localDb = localConn.db;
  const atlasDb = atlasConn.db;

  const collections = (await localDb.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  console.log(`Found ${collections.length} collections on local DB`);

  let total = 0;
  for (const name of collections) {
    total += await copyCollection(localDb, atlasDb, name);
  }

  await localConn.close();
  await atlasConn.close();

  console.log(`\nDone. ${total} documents copied to Atlas.`);
  console.log("Verify in Atlas → Browse Collections → database fzone");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
