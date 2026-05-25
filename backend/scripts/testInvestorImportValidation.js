/**
 * Unit-style tests for investor import validation (no DB required for header tests).
 * Run: node scripts/testInvestorImportValidation.js
 */
import { validateStrictHeaders } from "../utils/investorSchemaRegistry.js";
import { parseInvestorImportBuffer } from "../services/investorImportParser.js";
import XLSX from "xlsx";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Header tests
const good = validateStrictHeaders(["No", "Code_No", "Name", "Phone_No", "Gender"]);
assert(good.ok, "canonical headers should pass");

const noGender = validateStrictHeaders(["No", "Code_No", "Name", "Phone_No"]);
assert(noGender.ok, "missing optional Gender should pass");

const badCase = validateStrictHeaders(["No", "Code_No", "name", "Phone_No"]);
assert(!badCase.ok, "lowercase name should fail");
assert(badCase.missing.includes("Name"), "should report missing Name");

const extra = validateStrictHeaders(["No", "Code_No", "Name", "Phone_No", "Notes"]);
assert(!extra.ok, "unexpected column should fail");

// Build mini workbook
const ws = XLSX.utils.aoa_to_sheet([
  ["No", "Code_No", "Name", "Phone_No", "Gender"],
  [1, "FP900", "Test User", "9876543210", "Male"],
  [2, "FP901", "Test Two", "9876543211", ""],
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Investors");
const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

const parsed = parseInvestorImportBuffer(buffer, "test.xlsx");
assert(parsed.ok, `parse should succeed: ${JSON.stringify(parsed.errors)}`);
assert(parsed.rows.length === 2, "should parse 2 rows");

// Duplicate in file
const wsDup = XLSX.utils.aoa_to_sheet([
  ["No", "Code_No", "Name", "Phone_No"],
  [1, "FP900", "A", "9876543210"],
  [2, "FP900", "B", "9876543211"],
]);
const wbDup = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbDup, wsDup, "Investors");
const bufDup = XLSX.write(wbDup, { type: "buffer", bookType: "xlsx" });
const parsedDup = parseInvestorImportBuffer(bufDup, "dup.xlsx");
assert(parsedDup.ok, "dup file parse phase ok");

import { validateInvestorImportRows } from "../services/investorImportValidator.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

await mongoose.connect(process.env.MONGODB_SERVER_IP);
const validatedDup = await validateInvestorImportRows(parsedDup.rows);
assert(!validatedDup.ok, "duplicate Code_No in file should fail validation");
assert(validatedDup.errors.some((e) => e.field === "Code_No"), "dup error on Code_No");

// 1000 row smoke (parse only)
const rows1000 = [["No", "Code_No", "Name", "Phone_No"]];
for (let i = 1; i <= 1000; i++) {
  rows1000.push([i, `SM${String(i).padStart(4, "0")}`, `Investor ${i}`, String(9876500000 + (i % 999999))]);
}
const ws1k = XLSX.utils.aoa_to_sheet(rows1000);
const wb1k = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb1k, ws1k, "Investors");
const buf1k = XLSX.write(wb1k, { type: "buffer", bookType: "xlsx" });
const t0 = Date.now();
const parsed1k = parseInvestorImportBuffer(buf1k, "1k.xlsx");
const ms = Date.now() - t0;
assert(parsed1k.ok, "1000 row parse should succeed");
assert(parsed1k.rows.length === 1000, "1000 rows parsed");
console.log(`1000-row parse: ${ms}ms`);

await mongoose.disconnect();
console.log("All investor import validation tests passed.");
