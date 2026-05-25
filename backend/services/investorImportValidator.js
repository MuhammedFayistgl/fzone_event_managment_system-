import investorsModal from "../models/Investor.js";

/**
 * Validate parsed rows: in-file duplicates + DB upsert classification.
 * Returns all errors (reject-all policy).
 */
export async function validateInvestorImportRows(rows) {
  const errors = [];
  const codeSeen = new Map();
  const phoneSeen = new Map();

  for (const row of rows) {
    if (codeSeen.has(row.Code_No)) {
      errors.push({
        row: row.rowNumber,
        field: "Code_No",
        message: `Duplicate Code_No in file (also on row ${codeSeen.get(row.Code_No)})`,
      });
    } else {
      codeSeen.set(row.Code_No, row.rowNumber);
    }

    const phoneKey = String(row.Phone_No);
    if (phoneSeen.has(phoneKey)) {
      errors.push({
        row: row.rowNumber,
        field: "Phone_No",
        message: `Duplicate Phone_No in file (also on row ${phoneSeen.get(phoneKey)})`,
      });
    } else {
      phoneSeen.set(phoneKey, row.rowNumber);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, classified: [] };
  }

  const codes = rows.map((r) => r.Code_No);
  const phones = rows.map((r) => r.Phone_No);

  const existingRows = await investorsModal
    .find({
      $or: [{ Code_No: { $in: codes } }, { Phone_No: { $in: phones } }],
    })
    .select("_id No Code_No Name Phone_No Gender")
    .lean();

  const byCode = new Map(existingRows.map((e) => [e.Code_No, e]));
  const byPhone = new Map(existingRows.map((e) => [String(e.Phone_No), e]));

  const classified = [];

  for (const row of rows) {
    const matchCode = byCode.get(row.Code_No);
    const matchPhone = byPhone.get(String(row.Phone_No));

    if (matchCode && matchPhone && String(matchCode._id) !== String(matchPhone._id)) {
      errors.push({
        row: row.rowNumber,
        field: "Code_No",
        message: `Code_No and Phone_No match different existing investors (${row.Code_No} / ${row.Phone_No})`,
      });
      continue;
    }

    const existing = matchCode || matchPhone || null;

    if (existing) {
      const unchanged =
        existing.Name === row.Name &&
        existing.Gender === row.Gender &&
        String(existing.Phone_No) === String(row.Phone_No) &&
        existing.Code_No === row.Code_No;

      classified.push({
        ...row,
        action: unchanged ? "skip" : "update",
        existingId: existing._id,
      });
    } else {
      classified.push({
        ...row,
        action: "insert",
        existingId: null,
      });
    }
  }

  const summary = {
    total: rows.length,
    insert: classified.filter((r) => r.action === "insert").length,
    update: classified.filter((r) => r.action === "update").length,
    skip: classified.filter((r) => r.action === "skip").length,
    errors: errors.length,
  };

  return {
    ok: errors.length === 0,
    errors,
    classified,
    summary,
  };
}

export function mergeImportValidation(parseResult, validateResult) {
  const errors = [...(parseResult.errors || []), ...(validateResult.errors || [])];
  const ok = parseResult.ok && validateResult.ok && errors.length === 0;

  return {
    ok,
    headerCheck: parseResult.headerCheck,
    errors,
    rows: parseResult.rows || [],
    classified: validateResult.classified || [],
    summary: validateResult.summary || {
      total: parseResult.rows?.length || 0,
      insert: 0,
      update: 0,
      skip: 0,
      errors: errors.length,
    },
    preview: (parseResult.rows || []).slice(0, 20).map((r) => ({
      rowNumber: r.rowNumber,
      No: r.No,
      Code_No: r.Code_No,
      Name: r.Name,
      Phone_No: r.Phone_No,
      Gender: r.Gender,
    })),
  };
}
