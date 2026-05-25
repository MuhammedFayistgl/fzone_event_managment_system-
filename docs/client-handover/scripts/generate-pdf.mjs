import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mdToPdf } from "md-to-pdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const mdPath = path.join(ROOT, "F-Zone-Client-Guide.md");
const cssPath = path.join(ROOT, "pdf.css");
const outPath = path.join(ROOT, "F-Zone-Client-Guide.pdf");

if (!fs.existsSync(mdPath)) {
  console.error("Missing F-Zone-Client-Guide.md — run write step first.");
  process.exit(1);
}

await mdToPdf(
  { path: mdPath },
  {
    dest: outPath,
    basedir: ROOT,
    css: cssPath,
    pdf_options: {
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "16mm", bottom: "20mm", left: "16mm" },
    },
  }
);

console.log("PDF written:", outPath);
