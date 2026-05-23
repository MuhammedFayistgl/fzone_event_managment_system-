import mongoose from "mongoose";
import RegEventModel from "../models/EventRegistrationModel.js";
import Investor from "../models/Investor.js";
import { buildInvestorLookupByPhone } from "../utils/resolveRegistrationInvestors.js";

const args = new Set(process.argv.slice(2));
const confirm = args.has("--confirm");
const dryRun = args.has("--dry-run") || !confirm;

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fzone");

const registrations = await RegEventModel.find({}).select("_id phone investorId investorName").lean();
const byPhone = await buildInvestorLookupByPhone(registrations.map((r) => r.phone));

const orphanIds = [];

for (const registration of registrations) {
    const key = String(registration.phone || "").replace(/\D/g, "");
    const matched = byPhone.get(key);
    const hasStoredName = Boolean(registration.investorName?.trim());

    if (!matched && !hasStoredName) {
        orphanIds.push(registration._id);
    }
}

console.log(
    JSON.stringify(
        {
            mode: dryRun ? "dry-run" : "confirm",
            totalRegistrations: registrations.length,
            orphanCount: orphanIds.length,
            message: dryRun
                ? "Run with --confirm to delete orphan registrations"
                : "Deleting orphan registrations",
        },
        null,
        2
    )
);

if (!dryRun && orphanIds.length > 0) {
    const result = await RegEventModel.deleteMany({ _id: { $in: orphanIds } });
    console.log(JSON.stringify({ deleted: result.deletedCount }, null, 2));
}

await mongoose.disconnect();
