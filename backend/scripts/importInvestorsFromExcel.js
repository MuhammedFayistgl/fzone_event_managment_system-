/**
 * Import investors from Excel/CSV into MongoDB.
 * Usage (from backend folder):
 *   node scripts/importInvestorsFromExcel.js --dry-run
 *   node scripts/importInvestorsFromExcel.js
 *   node scripts/importInvestorsFromExcel.js --file "../../Database/new list.xlsx"
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import XLSX from "xlsx";
import investorsModal from "../models/Investor.js";
import { resolveInvestorGender } from "../utils/gender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_FILE = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "Database",
    "new list.xlsx"
);

const normalizePhone = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
};

const normalizeCode = (value) => String(value ?? "").trim().toUpperCase();

const readRowsFromFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    let rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const firstKeys = Object.keys(rows[0] || {}).map((k) => k.trim().toLowerCase());
    const hasNamedHeaders = ["no", "code_no", "name", "phone_no"].every((h) =>
        firstKeys.includes(h)
    );

    if (!hasNamedHeaders) {
        // Excel export without header row — first row is data
        rows = XLSX.utils.sheet_to_json(sheet, {
            header: ["No", "Code_No", "Name", "Phone_No"],
            defval: "",
        });
    }

    return rows.filter((row) => {
        const code = row.Code_No ?? row.code_no ?? row["Code No"];
        const name = row.Name ?? row.name;
        return String(code).trim() || String(name).trim();
    });
};

const mapRow = (raw, index) => {
    const keys = Object.keys(raw);
    const find = (...names) => {
        for (const name of names) {
            const hit = keys.find(
                (k) => k.trim().toLowerCase() === name.toLowerCase()
            );
            if (hit !== undefined && raw[hit] !== "") return raw[hit];
        }
        return "";
    };

    const No = Number(find("No", "NO", "S.No", "Sl No")) || index + 1;
    const Code_No = normalizeCode(find("Code_No", "Code", "CODE", "ID"));
    const Name = String(find("Name", "NAME", "Participant", "Full Name")).trim();
    const Phone_No = normalizePhone(find("Phone_No", "Phone", "Mobile", "PHONE"));
    const genderFromSheet = find("Gender", "GENDER", "Sex");

    if (!Code_No || !Name || !Phone_No) {
        return {
            error: `Row ${index + 2}: missing Code, Name, or Phone`,
            raw,
        };
    }

    if (Phone_No.length !== 10) {
        return {
            error: `Row ${index + 2} (${Code_No}): invalid phone "${Phone_No}"`,
            raw,
        };
    }

    const Gender = resolveInvestorGender(Name, genderFromSheet).gender;

    return {
        No,
        Code_No,
        Name,
        Phone_No: Number(Phone_No),
        Gender,
    };
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArgIdx = args.indexOf("--file");
const filePath =
    fileArgIdx >= 0 ? path.resolve(args[fileArgIdx + 1]) : DEFAULT_FILE;

console.log(`\n📂 Source: ${filePath}`);
console.log(dryRun ? "🔍 DRY RUN (no DB writes)\n" : "📥 LIVE IMPORT\n");

const rawRows = readRowsFromFile(filePath);
console.log(`Rows in file: ${rawRows.length}`);

const parsed = [];
const errors = [];

for (let i = 0; i < rawRows.length; i++) {
    const result = mapRow(rawRows[i], i);
    if (result.error) errors.push(result.error);
    else parsed.push(result);
}

const codeSet = new Set();
const phoneSet = new Set();
const dupInFile = [];

for (const row of parsed) {
    if (codeSet.has(row.Code_No) || phoneSet.has(String(row.Phone_No))) {
        dupInFile.push(`${row.Code_No} / ${row.Phone_No}`);
    }
    codeSet.add(row.Code_No);
    phoneSet.add(String(row.Phone_No));
}

const genderCounts = parsed.reduce(
    (acc, r) => {
        acc[r.Gender] = (acc[r.Gender] || 0) + 1;
        return acc;
    },
    { Male: 0, Female: 0, Other: 0 }
);

console.log("\n--- Preview ---");
console.log(`Valid rows:   ${parsed.length}`);
console.log(`Errors:       ${errors.length}`);
console.log(`Dup in file:  ${dupInFile.length}`);
console.log(`Gender:       Male ${genderCounts.Male}, Female ${genderCounts.Female}, Other ${genderCounts.Other}`);
console.log("\nSample (first 5):");
parsed.slice(0, 5).forEach((r) =>
    console.log(`  ${r.Code_No} | ${r.Name} | ${r.Phone_No} | ${r.Gender}`)
);

if (errors.length) {
    console.log("\nFirst errors:");
    errors.slice(0, 10).forEach((e) => console.log("  ❌", e));
}

if (dryRun) {
    console.log("\n✅ Dry run complete. Run without --dry-run to import.");
    console.log("⚠️  Live import requires --confirm flag.\n");
    process.exit(errors.length ? 1 : 0);
}

if (!args.includes("--confirm")) {
    console.error(
        "\n❌ Live import blocked. Re-run with: node scripts/importInvestorsFromExcel.js --confirm\n"
    );
    process.exit(1);
}

await mongoose.connect(process.env.MONGODB_SERVER_IP);

let inserted = 0;
let updated = 0;
let skipped = 0;

for (const row of parsed) {
    const existing = await investorsModal.findOne({
        $or: [{ Code_No: row.Code_No }, { Phone_No: row.Phone_No }],
    });

    if (existing) {
        const needsUpdate =
            existing.Name !== row.Name ||
            existing.Gender !== row.Gender ||
            String(existing.Phone_No) !== String(row.Phone_No);

        if (needsUpdate) {
            await investorsModal.updateOne(
                { _id: existing._id },
                {
                    $set: {
                        Name: row.Name,
                        Phone_No: row.Phone_No,
                        Gender: row.Gender,
                        Code_No: row.Code_No,
                    },
                }
            );
            updated++;
        } else {
            skipped++;
        }
        continue;
    }

    // Preserve spreadsheet No when possible; fallback to auto
    let No = row.No;
    const noTaken = await investorsModal.findOne({ No });
    if (noTaken) {
        const last = await investorsModal.findOne().sort({ No: -1 }).lean();
        No = (last?.No || 0) + 1;
    }

    try {
        await investorsModal.create({ ...row, No });
        inserted++;
    } catch (err) {
        if (err.code === 11000) {
            errors.push(`Duplicate key on insert: ${row.Code_No}`);
            skipped++;
        } else {
            throw err;
        }
    }
}

const totalInDb = await investorsModal.countDocuments();

console.log("\n--- Import result ---");
console.log(`Inserted: ${inserted}`);
console.log(`Updated:  ${updated}`);
console.log(`Skipped:  ${skipped}`);
console.log(`Total in MongoDB: ${totalInDb}`);
console.log(`Import errors: ${errors.length}`);

await mongoose.disconnect();
console.log("\n✅ Done.\n");
