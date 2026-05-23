import mongoose from "mongoose";
import Investor from "../models/Investor.js";
import { buildInvestorSearchFilter } from "../utils/investorSearch.js";

const normalizeGender = (gender) => {
    const VALID = ["Male", "Female", "Other"];
    if (!gender || typeof gender !== "string") return null;
    const trimmed = gender.trim();
    return VALID.find((g) => g.toLowerCase() === trimmed.toLowerCase()) || null;
};

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fzone");

for (const term of ["ABDUL", "7736121247", "7736", "FP001", "Male"]) {
    const filter = buildInvestorSearchFilter(term, normalizeGender);
    const count = await Investor.countDocuments(filter);
    console.log(term, "->", count);
}

await mongoose.disconnect();
