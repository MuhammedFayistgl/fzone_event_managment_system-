/**
 * Export Excel with Gender column added (for review/download).
 * Usage: node scripts/exportInvestorsWithGender.js
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "Database",
    "new list.xlsx"
);

const OUT_XLSX = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "Database",
    "new list with gender.xlsx"
);

const OUT_CSV = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "Database",
    "new list with gender.csv"
);

const FEMALE_TOKENS = [
    "fathima", "fatima", "fathimath", "rasheeda", "rashida", "saleena",
    "kadeeja", "khadeeja", "kadija", "nabeela", "nabeesa", "jameela",
    "sajna", "ramla", "ramlath", "mihra", "shabana", "ayisha", "aisha",
    "ayishabi", "mariam", "maryam", "haseena", "nasreen", "beevi", "beegam",
    "banu", "hajira", "souda", "suhara", "sakina", "sakeena", "nadeera",
    "nadheera", "habeeba", "ummu", "umma", "mufeeda", "farhana", "henna",
    "safiya", "zubaida", "hafsa", "ruksana", "rukhsana", "nafisa", "seenath",
    "shareefa", "muneera", "rafeena", "shameera", "juvairia", "asiya", "asna",
    "neema", "seena", "suhra",
];

const MALE_TOKENS = [
    "abdul", "abdu", "mohammed", "muhammad", "muhammed", "ibrahim",
    "aboobacker", "abubacker", "hamdan", "shamsudheen", "shamsuddeen",
    "neehad", "ashraf", "kunhalan", "yahkoob", "fazil", "musthafa", "safvan",
    "mubarak", "basith", "refeek", "aslam", "jamsheed", "labeeb", "kabeer",
    "haris", "wasih", "thajuddeen", "shereef", "majeed", "hasik", "rahiman",
    "muhiyidheen", "abdurahiman", "musliyar", "kunhi", "shareef", "anees",
    "salam", "jaleel", "raoof", "farook", "farooq", "haneef", "saeed",
    "sidheeq", "shafi", "shukoor", "usman", "mansoor", "muneer", "noushad",
];

const inferGenderFromName = (name) => {
    const n = ` ${String(name).toLowerCase().replace(/[.,]/g, " ")} `;
    for (const token of FEMALE_TOKENS) {
        if (n.includes(token)) return "Female";
    }
    for (const token of MALE_TOKENS) {
        if (n.includes(token)) return "Male";
    }
    const first = String(name).trim().split(/\s+/)[0]?.toLowerCase() || "";
    if (
        first.length > 3 &&
        first.endsWith("a") &&
        !first.endsWith("ulla") &&
        !["abdulla", "mustafa", "hamza"].some((m) => first.includes(m))
    ) {
        return "Female";
    }
    return "Other";
};

if (!fs.existsSync(SOURCE)) {
    console.error("Source not found:", SOURCE);
    process.exit(1);
}

const wb = XLSX.readFile(SOURCE);
const sheet = wb.Sheets[wb.SheetNames[0]];
let rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
const firstKeys = Object.keys(rows[0] || {}).map((k) => k.trim().toLowerCase());
const hasNamedHeaders = ["no", "code_no", "name", "phone_no"].every((h) =>
    firstKeys.includes(h)
);

if (!hasNamedHeaders) {
    rows = XLSX.utils.sheet_to_json(sheet, {
        header: ["No", "Code_No", "Name", "Phone_No"],
        defval: "",
    });
}

const exportRows = rows
    .filter((r) => String(r.Code_No || "").trim() && String(r.Name || "").trim())
    .map((r) => ({
        No: r.No,
        Code_No: String(r.Code_No).trim().toUpperCase(),
        Name: String(r.Name).trim(),
        Phone_No: String(r.Phone_No).replace(/\D/g, "").slice(-10),
        Gender: inferGenderFromName(r.Name),
    }));

const counts = exportRows.reduce(
    (acc, r) => {
        acc[r.Gender] = (acc[r.Gender] || 0) + 1;
        return acc;
    },
    { Male: 0, Female: 0, Other: 0 }
);

const outWb = XLSX.utils.book_new();
const outSheet = XLSX.utils.json_to_sheet(exportRows, {
    header: ["No", "Code_No", "Name", "Phone_No", "Gender"],
});
XLSX.utils.book_append_sheet(outWb, outSheet, "Investors");
XLSX.writeFile(outWb, OUT_XLSX);

const csv = [
    "No,Code_No,Name,Phone_No,Gender",
    ...exportRows.map(
        (r) =>
            `${r.No},${r.Code_No},"${r.Name.replace(/"/g, '""')}",${r.Phone_No},${r.Gender}`
    ),
].join("\n");
fs.writeFileSync(OUT_CSV, csv, "utf8");

console.log("\n✅ Gender column added — files ready for download:\n");
console.log("XLSX:", OUT_XLSX);
console.log("CSV: ", OUT_CSV);
console.log(`\nRows: ${exportRows.length}`);
console.log(`Male: ${counts.Male} | Female: ${counts.Female} | Other: ${counts.Other}`);
console.log("\nReview 'Other' rows in Excel and fix Gender before re-import.\n");
