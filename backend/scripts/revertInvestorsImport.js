/**
 * Remove investors that match codes from the Excel/CSV import file.
 * Usage: node scripts/revertInvestorsImport.js
 */
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import XLSX from "xlsx";
import investorsModal from "../models/Investor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const FILE = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "Database",
    "new list.xlsx"
);

const wb = XLSX.readFile(FILE);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, {
    header: ["No", "Code_No", "Name", "Phone_No"],
    defval: "",
});

const codes = rows
    .map((r) => String(r.Code_No || "").trim().toUpperCase())
    .filter(Boolean);

await mongoose.connect(process.env.MONGODB_SERVER_IP);

const before = await investorsModal.countDocuments();
const result = await investorsModal.deleteMany({ Code_No: { $in: codes } });
const after = await investorsModal.countDocuments();

console.log(`File codes: ${codes.length}`);
console.log(`Deleted: ${result.deletedCount}`);
console.log(`Before: ${before} → After: ${after}`);

await mongoose.disconnect();
