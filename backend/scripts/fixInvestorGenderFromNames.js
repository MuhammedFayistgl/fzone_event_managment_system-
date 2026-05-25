/**
 * Fix investor Gender in MongoDB using name-based inference.
 * Usage (from backend folder):
 *   node scripts/fixInvestorGenderFromNames.js --dry-run
 *   node scripts/fixInvestorGenderFromNames.js --confirm
 */
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import investorsModal from "../models/Investor.js";
import { resolveInvestorGender } from "../utils/gender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const args = process.argv.slice(2);
const dryRun = !args.includes("--confirm");

const main = async () => {
    const uri =
        process.env.MONGODB_SERVER_IP ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/fzone";

    await mongoose.connect(uri);
    const investors = await investorsModal.find().select("_id Code_No Name Gender").lean();

    const changes = [];
    for (const row of investors) {
        const resolution = resolveInvestorGender(row.Name, row.Gender);
        if (resolution.gender !== row.Gender) {
            changes.push({
                id: row._id,
                code: row.Code_No,
                from: row.Gender,
                to: resolution.gender,
                matchReason: resolution.matchReason,
            });
        }
    }

    console.log(`\nInvestors scanned: ${investors.length}`);
    console.log(`Would update:      ${changes.length}`);
    console.log(dryRun ? "Mode: DRY RUN\n" : "Mode: LIVE\n");

    if (changes.length) {
        console.log("Sample changes:");
        changes.slice(0, 15).forEach((c) => {
            console.log(`  ${c.code}: ${c.from} → ${c.to} (${c.matchReason})`);
        });
    }

    if (!dryRun && changes.length > 0) {
        const bulk = changes.map((c) => ({
            updateOne: {
                filter: { _id: c.id },
                update: { $set: { Gender: c.to } },
            },
        }));
        await investorsModal.bulkWrite(bulk);
        console.log(`\n✅ Updated ${changes.length} investor(s).`);
    } else if (dryRun) {
        console.log("\n✅ Dry run complete. Re-run with --confirm to apply.");
    } else {
        console.log("\n✅ No changes needed.");
    }

    await mongoose.disconnect();
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
