import multer from "multer";
import { TICKET_BG_DIR } from "../utils/ticketBackground.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TICKET_BG_DIR);
  },
  filename: (req, _file, cb) => {
    cb(null, `${req.params.id}.upload`);
  },
});

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export const ticketBackgroundUpload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, or WebP images are allowed"));
    }
  },
});
