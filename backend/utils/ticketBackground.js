import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TICKET_BG_DIR = path.join(__dirname, "..", "uploads", "ticket-backgrounds");

export async function ensureTicketBgDir() {
  await fs.mkdir(TICKET_BG_DIR, { recursive: true });
}

export function ticketBgFilePath(eventId, ext = "webp") {
  return path.join(TICKET_BG_DIR, `${eventId}.${ext}`);
}

export function ticketBgPublicUrl(eventId, ext = "webp") {
  return `/uploads/ticket-backgrounds/${eventId}.${ext}`;
}

export async function deleteTicketBgFiles(eventId) {
  for (const ext of ["webp", "png", "jpg", "jpeg"]) {
    try {
      await fs.unlink(ticketBgFilePath(eventId, ext));
    } catch {
      /* ignore missing */
    }
  }
}
