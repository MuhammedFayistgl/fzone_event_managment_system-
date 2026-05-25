import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const SOURCE_DIR = path.join(ROOT, "docs", "client-handover");
const DEST_DIR = path.join(ROOT, "frontend", "public", "guides");

const FILES = [
  {
    src: path.join(SOURCE_DIR, "F-Zone-Client-Guide.pdf"),
    dest: path.join(DEST_DIR, "F-Zone-Client-Guide.pdf"),
  },
  {
    src: path.join(SOURCE_DIR, "F-Zone-Client-Guide-CopyPaste.txt"),
    dest: path.join(DEST_DIR, "F-Zone-Client-Guide.txt"),
  },
];

const pdfSource = FILES[0].src;
if (!fs.existsSync(pdfSource)) {
  console.error(
    "Missing PDF. Generate it first:\n  cd docs/client-handover && npm run pdf"
  );
  process.exit(1);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

for (const { src, dest } of FILES) {
  if (!fs.existsSync(src)) {
    console.warn("Skipping (not found):", path.relative(ROOT, src));
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log("Copied:", path.relative(ROOT, src), "→", path.relative(ROOT, dest));
}

console.log("Client guide synced to frontend/public/guides/");
