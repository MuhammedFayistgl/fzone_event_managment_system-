import investorsModal from "../models/Investor.js";
import { parseInvestorImportBuffer } from "./investorImportParser.js";
import {
  mergeImportValidation,
  validateInvestorImportRows,
} from "./investorImportValidator.js";
import { clearInvestorListCache } from "../utils/dashboardCache.js";

async function resolveNextNo(preferredNo) {
  const taken = await investorsModal.findOne({ No: preferredNo }).lean();
  if (!taken) return preferredNo;
  const last = await investorsModal.findOne().sort({ No: -1 }).lean();
  return (last?.No || 0) + 1;
}

/**
 * Full import pipeline: parse → validate → upsert (reject-all if any error).
 */
export async function runInvestorImport(buffer, fileName = "") {
  const parsed = parseInvestorImportBuffer(buffer, fileName);
  if (!parsed.ok) {
    return {
      ok: false,
      phase: "parse",
      ...mergeImportValidation(parsed, {
        ok: false,
        errors: parsed.errors || [],
        classified: [],
        summary: {},
      }),
      counts: { inserted: 0, updated: 0, skipped: 0 },
    };
  }

  const validated = await validateInvestorImportRows(parsed.rows);
  const merged = mergeImportValidation(parsed, validated);

  if (!merged.ok) {
    return {
      ok: false,
      phase: "validate",
      ...merged,
      counts: { inserted: 0, updated: 0, skipped: 0 },
    };
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of merged.classified) {
    if (row.action === "skip") {
      skipped++;
      continue;
    }

    if (row.action === "update") {
      await investorsModal.updateOne(
        { _id: row.existingId },
        {
          $set: {
            Code_No: row.Code_No,
            Name: row.Name,
            Phone_No: row.Phone_No,
            Gender: row.Gender,
          },
        }
      );
      updated++;
      continue;
    }

    const No = await resolveNextNo(row.No);
    await investorsModal.create({
      No,
      Code_No: row.Code_No,
      Name: row.Name,
      Phone_No: row.Phone_No,
      Gender: row.Gender,
    });
    inserted++;
  }

  await clearInvestorListCache();

  return {
    ok: true,
    phase: "commit",
    ...merged,
    counts: { inserted, updated, skipped },
  };
}

export async function dryRunInvestorImport(buffer, fileName = "") {
  const parsed = parseInvestorImportBuffer(buffer, fileName);
  if (!parsed.ok) {
    return mergeImportValidation(parsed, {
      ok: false,
      errors: parsed.errors || [],
      classified: [],
      summary: {
        total: 0,
        insert: 0,
        update: 0,
        skip: 0,
        errors: parsed.errors?.length || 0,
      },
    });
  }

  const validated = await validateInvestorImportRows(parsed.rows);
  return mergeImportValidation(parsed, validated);
}
