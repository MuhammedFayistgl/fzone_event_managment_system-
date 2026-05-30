import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import { logAuditAction } from "../utils/auditLog.js";
import { logServerEvent } from "./platformOpsService.js";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupsDir = path.join(__dirname, "..", "backups");

async function ensureBackupsDir() {
  await fs.mkdir(backupsDir, { recursive: true });
}

export async function createDatabaseBackup(actor, req) {
  await ensureBackupsDir();
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw Object.assign(new Error("MongoDB URI not configured"), { statusCode: 503 });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archivePath = path.join(backupsDir, `backup-${stamp}.archive.gz`);

  try {
    await execFileAsync("mongodump", [`--uri=${mongoUri}`, `--archive=${archivePath}`, "--gzip"], {
      timeout: 120_000,
    });
  } catch (err) {
    await logServerEvent("error", "Database backup failed", { message: err.message });
    throw Object.assign(new Error("Backup failed — ensure mongodump is installed on server"), {
      statusCode: 500,
    });
  }

  const stat = await fs.stat(archivePath);
  await logServerEvent("info", "Database backup completed", {
    file: path.basename(archivePath),
    bytes: stat.size,
  });

  await logAuditAction({
    action: "platform.backup_created",
    category: "settings",
    actor,
    metadata: { file: path.basename(archivePath), bytes: stat.size },
    req,
  });

  return {
    fileName: path.basename(archivePath),
    bytes: stat.size,
    createdAt: new Date().toISOString(),
  };
}

export async function listDatabaseBackups() {
  await ensureBackupsDir();
  const files = await fs.readdir(backupsDir);
  const rows = [];
  for (const file of files) {
    if (!file.endsWith(".archive.gz")) continue;
    const stat = await fs.stat(path.join(backupsDir, file));
    rows.push({
      fileName: file,
      bytes: stat.size,
      createdAt: stat.mtime.toISOString(),
    });
  }
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function restoreDatabaseBackup(fileName, actor, req) {
  if (!fileName || fileName.includes("..") || fileName.includes("/")) {
    throw Object.assign(new Error("Invalid backup file"), { statusCode: 400 });
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw Object.assign(new Error("MongoDB URI not configured"), { statusCode: 503 });
  }

  const archivePath = path.join(backupsDir, fileName);
  try {
    await fs.access(archivePath);
  } catch {
    throw Object.assign(new Error("Backup file not found"), { statusCode: 404 });
  }

  try {
    await execFileAsync("mongorestore", [`--uri=${mongoUri}`, `--archive=${archivePath}`, "--gzip", "--drop"], {
      timeout: 180_000,
    });
  } catch (err) {
    await logServerEvent("critical", "Database restore failed", { fileName, message: err.message });
    throw Object.assign(new Error("Restore failed"), { statusCode: 500 });
  }

  await logAuditAction({
    action: "platform.backup_restored",
    category: "settings",
    actor,
    metadata: { fileName },
    req,
  });

  await logServerEvent("warn", "Database restored from backup", { fileName });
  return { success: true, fileName };
}

export async function restartDeployment(actor, req) {
  const token = process.env.RAILWAY_TOKEN;
  const serviceId = process.env.RAILWAY_SERVICE_ID;

  if (!token || !serviceId) {
    return {
      success: false,
      manual: true,
      message: "Railway API not configured. Restart from Railway dashboard.",
      dashboardUrl: "https://railway.app/dashboard",
    };
  }

  const response = await fetch(`https://backboard.railway.app/graphql/v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `mutation ServiceInstanceRedeploy($serviceId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId)
      }`,
      variables: { serviceId },
    }),
  });

  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw Object.assign(new Error("Railway restart failed"), { statusCode: 502 });
  }

  await logAuditAction({
    action: "platform.server_restart",
    category: "settings",
    actor,
    req,
  });

  return { success: true, provider: "railway" };
}

export function verifyPlatformWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}
