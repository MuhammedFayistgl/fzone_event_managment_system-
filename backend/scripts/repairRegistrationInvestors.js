import mongoose from "mongoose";
import RegEventModel from "../models/EventRegistrationModel.js";
import {
    buildInvestorLookupByPhone,
    repairRegistrationInvestorIds,
} from "../utils/resolveRegistrationInvestors.js";

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fzone");

const registrations = await RegEventModel.find({}).lean();
const byPhone = await buildInvestorLookupByPhone(registrations.map((r) => r.phone));
const repaired = await repairRegistrationInvestorIds(registrations, byPhone);

console.log(
    JSON.stringify(
        {
            total: registrations.length,
            repaired,
            message:
                repaired > 0
                    ? "Linked registrations to current investors by phone"
                    : "No registrations matched current investor phones",
        },
        null,
        2
    )
);

await mongoose.disconnect();
