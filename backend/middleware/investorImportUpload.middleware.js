import multer from "multer";

const ALLOWED = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
]);

const ALLOWED_EXT = /\.(xlsx|csv)$/i;

export const investorImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extOk = ALLOWED_EXT.test(file.originalname || "");
    const mimeOk = ALLOWED.has(file.mimetype) || extOk;
    if (mimeOk) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx or .csv files are allowed"));
    }
  },
});

export function handleInvestorImportUploadError(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: false,
      message: err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5MB)" : err.message,
    });
  }
  if (err) {
    return res.status(400).json({ status: false, message: err.message });
  }
  next();
}
