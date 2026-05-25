import investorsModal from "../models/Investor.js";
import InvestorImportJob from "../models/InvestorImportJobModel.js";
import {
  buildTemplateRows,
  getInvestorSchema,
  investorToExportRow,
} from "../utils/investorSchemaRegistry.js";
import {
  buildErrorReportWorkbook,
  buildWorkbookFromRows,
} from "../services/investorImportParser.js";
import {
  dryRunInvestorImport,
  runInvestorImport,
} from "../services/investorImportExecutor.js";
import { logAuditAction } from "../utils/auditLog.js";

function getFileFromRequest(req) {
  return req.file?.buffer
    ? { buffer: req.file.buffer, fileName: req.file.originalname || "upload.xlsx" }
    : null;
}

export const getInvestorSchemaHandler = async (_req, res) => {
  try {
    res.json({ status: true, data: getInvestorSchema() });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const downloadInvestorTemplate = async (_req, res) => {
  try {
    const buffer = buildWorkbookFromRows(buildTemplateRows(), "Template");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="investor_template.xlsx"'
    );
    res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const exportInvestorsXlsx = async (_req, res) => {
  try {
    const investors = await investorsModal
      .find()
      .sort({ No: 1 })
      .select("No Code_No Name Phone_No Gender")
      .lean();

    const rows = investors.map(investorToExportRow);
    const buffer = buildWorkbookFromRows(rows, "Investors");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="investors_export.xlsx"'
    );
    res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const investorImportDryRun = async (req, res) => {
  try {
    const file = getFileFromRequest(req);
    if (!file) {
      return res.status(400).json({ status: false, message: "File is required" });
    }

    const result = await dryRunInvestorImport(file.buffer, file.fileName);

    res.json({
      status: true,
      data: {
        ok: result.ok,
        headerCheck: result.headerCheck,
        preview: result.preview,
        summary: result.summary,
        errors: result.errors,
        totalRows: result.rows?.length || 0,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const downloadInvestorImportErrorReport = async (req, res) => {
  try {
    const file = getFileFromRequest(req);
    if (!file) {
      return res.status(400).json({ status: false, message: "File is required" });
    }

    const result = await dryRunInvestorImport(file.buffer, file.fileName);
    const buffer = buildErrorReportWorkbook(result.rows || [], result.errors || []);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="investor_import_errors.xlsx"'
    );
    res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const investorImportCommit = async (req, res) => {
  try {
    const file = getFileFromRequest(req);
    if (!file) {
      return res.status(400).json({ status: false, message: "File is required" });
    }

    const result = await runInvestorImport(file.buffer, file.fileName);

    const jobStatus = result.ok ? "completed" : "rejected";

    const job = await InvestorImportJob.create({
      fileName: file.fileName,
      status: jobStatus,
      adminId: req.user?.id || req.user?._id || null,
      adminEmail: req.user?.email || "",
      counts: {
        inserted: result.counts?.inserted || 0,
        updated: result.counts?.updated || 0,
        skipped: result.counts?.skipped || 0,
        total: result.summary?.total || 0,
      },
      errorCount: result.errors?.length || 0,
      errors: (result.errors || []).slice(0, 100),
    });

    if (!result.ok) {
      return res.status(422).json({
        status: false,
        message: "Import rejected — fix all errors and try again",
        data: {
          jobId: job._id,
          ok: false,
          headerCheck: result.headerCheck,
          summary: result.summary,
          errors: result.errors,
        },
      });
    }

    await logAuditAction({
      action: "investor_bulk_import",
      category: "admin",
      actor: req.user,
      targetType: "investor_import",
      targetId: String(job._id),
      metadata: {
        fileName: file.fileName,
        counts: result.counts,
        total: result.summary?.total,
      },
      req,
    });

    res.json({
      status: true,
      message: "Import completed successfully",
      data: {
        jobId: job._id,
        ok: true,
        counts: result.counts,
        summary: result.summary,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const getInvestorImportHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const jobs = await InvestorImportJob.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ status: true, data: jobs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};
