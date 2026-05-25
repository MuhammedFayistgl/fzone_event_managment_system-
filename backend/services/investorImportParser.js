import XLSX from "xlsx";
import { resolveInvestorGender } from "../utils/gender.js";
import {
  INVESTOR_CANONICAL_HEADERS,
  MAX_IMPORT_ROWS,
  validateStrictHeaders,
} from "../utils/investorSchemaRegistry.js";
import { normalizeInvestorPhone } from "../utils/investorCrud.js";

function sheetToMatrix(buffer, fileName = "") {
  const isCsv = fileName.toLowerCase().endsWith(".csv");
  const wb = XLSX.read(buffer, {
    type: "buffer",
    raw: false,
    cellDates: false,
  });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    throw new Error("Workbook has no sheets");
  }
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    ...(isCsv ? {} : {}),
  });
}

function isEmptyRow(row) {
  return !(row || []).some((cell) => String(cell ?? "").trim());
}

function cellValue(row, index) {
  return row[index] !== undefined && row[index] !== null
    ? String(row[index]).trim()
    : "";
}

/**
 * Parse upload buffer with strict header enforcement.
 */
export function parseInvestorImportBuffer(buffer, fileName = "") {
  const matrix = sheetToMatrix(buffer, fileName);
  if (!matrix.length) {
    return {
      ok: false,
      headerCheck: { ok: false, message: "File is empty" },
      rows: [],
      errors: [{ row: 1, field: "file", message: "File is empty" }],
    };
  }

  const headerRow = matrix[0].map((c) => String(c ?? "").trim());
  const headerCheck = validateStrictHeaders(headerRow);

  if (!headerCheck.ok) {
    return {
      ok: false,
      headerCheck,
      rows: [],
      errors: [
        {
          row: 1,
          field: "headers",
          message: headerCheck.message,
        },
      ],
    };
  }

  const colIndex = {};
  for (const h of INVESTOR_CANONICAL_HEADERS) {
    const idx = headerRow.indexOf(h);
    if (idx >= 0) colIndex[h] = idx;
  }

  const rows = [];
  const parseErrors = [];

  for (let i = 1; i < matrix.length; i++) {
    const raw = matrix[i];
    if (isEmptyRow(raw)) continue;

    const rowNumber = i + 1;
    const rawNo = cellValue(raw, colIndex.No);
    const rawCode = cellValue(raw, colIndex.Code_No);
    const rawName = cellValue(raw, colIndex.Name);
    const rawPhone = cellValue(raw, colIndex.Phone_No);
    const rawGender =
      colIndex.Gender !== undefined ? cellValue(raw, colIndex.Gender) : "";

    if (!rawCode && !rawName && !rawPhone) continue;

    const No = Number(rawNo);
    if (!rawNo || !Number.isFinite(No) || No < 1) {
      parseErrors.push({
        row: rowNumber,
        field: "No",
        message: "No must be a positive number",
      });
      continue;
    }

    const Code_No = rawCode.toUpperCase();
    if (!Code_No) {
      parseErrors.push({
        row: rowNumber,
        field: "Code_No",
        message: "Code_No is required",
      });
      continue;
    }

    const Name = rawName.trim();
    if (!Name) {
      parseErrors.push({
        row: rowNumber,
        field: "Name",
        message: "Name is required",
      });
      continue;
    }

    const phone = normalizeInvestorPhone(rawPhone);
    if (!phone.ok) {
      parseErrors.push({
        row: rowNumber,
        field: "Phone_No",
        message: phone.message,
      });
      continue;
    }

    const Gender = resolveInvestorGender(Name, rawGender || "Other").gender;

    rows.push({
      rowNumber,
      No,
      Code_No,
      Name,
      Phone_No: phone.phoneNumber,
      Gender,
      raw: { No: rawNo, Code_No: rawCode, Name: rawName, Phone_No: rawPhone, Gender: rawGender },
    });

    if (rows.length > MAX_IMPORT_ROWS) {
      parseErrors.push({
        row: rowNumber,
        field: "file",
        message: `Maximum ${MAX_IMPORT_ROWS} data rows allowed`,
      });
      break;
    }
  }

  if (!rows.length && parseErrors.length === 0) {
    parseErrors.push({
      row: 2,
      field: "file",
      message: "No data rows found after header",
    });
  }

  return {
    ok: headerCheck.ok && parseErrors.length === 0,
    headerCheck,
    rows,
    errors: parseErrors,
    totalDataRows: rows.length,
  };
}

export function buildErrorReportWorkbook(rows, errors) {
  const errorByRow = errors.reduce((acc, e) => {
    const prev = acc[e.row] || "";
    acc[e.row] = prev ? `${prev}; ${e.field}: ${e.message}` : `${e.field}: ${e.message}`;
    return acc;
  }, {});

  const exportRows = rows.map((r) => ({
    No: r.raw?.No ?? r.No,
    Code_No: r.raw?.Code_No ?? r.Code_No,
    Name: r.raw?.Name ?? r.Name,
    Phone_No: r.raw?.Phone_No ?? r.Phone_No,
    Gender: r.raw?.Gender ?? r.Gender,
    Error: errorByRow[r.rowNumber] || "",
  }));

  for (const e of errors) {
    if (!exportRows.some((r) => r.Error && errorByRow[e.row] === r.Error)) {
      exportRows.push({
        No: "",
        Code_No: "",
        Name: "",
        Phone_No: "",
        Gender: "",
        Error: `${e.field}: ${e.message}`,
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(exportRows, {
    header: ["No", "Code_No", "Name", "Phone_No", "Gender", "Error"],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errors");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function buildWorkbookFromRows(rows, sheetName = "Investors") {
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: [...INVESTOR_CANONICAL_HEADERS],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
