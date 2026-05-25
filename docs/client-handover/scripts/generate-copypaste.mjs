import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const mdPath = path.join(ROOT, "F-Zone-Client-Guide.md");
const outPath = path.join(ROOT, "F-Zone-Client-Guide-CopyPaste.txt");

let text = fs.readFileSync(mdPath, "utf8");

text = text
  .replace(/^---[\s\S]*?---\n/m, "")
  .replace(/<[^>]+>/g, "")
  .replace(/!\[[^\]]*\]\([^)]+\)/g, "[Screenshot — see PDF]")
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2")
  .replace(/^#{1,6}\s+/gm, "")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/\*([^*]+)\*/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .replace(/^>\s?/gm, "")
  .replace(/^\|.*\|\s*$/gm, "")
  .replace(/^[-|: ]+\s*$/gm, "")
  .replace(/^title:.*$/gm, "")
  .replace(/^version:.*$/gm, "")
  .replace(/^\s*$/gm, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

const header = `F-ZONE EVENT MANAGEMENT — CLIENT GUIDE
(Copy & Paste for WhatsApp / Email)
====================================
PDF with screenshots: F-Zone-Client-Guide.pdf
Login: https://fzone-event-managment-system.vercel.app/login
Super Admin: fzone@gmail.com (password via secure channel)

---

`;

fs.writeFileSync(outPath, header + text + "\n", "utf8");
console.log("Copy-paste text written:", outPath);
