import os from "os";
import mongoose from "mongoose";
import { getOrgSettings, updateOrgSettings } from "../utils/appSettings.js";
import { getRedisClient, isRedisEnabled, redisGet, redisSetEx } from "../config/redis.js";
import { getApiUsageCounters } from "../middleware/apiUsage.middleware.js";
import { getStorageUsageSnapshot } from "../middleware/usageLimit.middleware.js";
import { getOnlineConnectionCount } from "../live/liveHub.js";
import { getPlanLimits, PLAN_TIER_DEFAULTS } from "../constants/platformPlans.js";
import UsageMetric from "../models/usageMetricModel.js";
import ServerLog from "../models/serverLogModel.js";
import AuditLog from "../models/auditLogModel.js";
import Investor from "../models/Investor.js";
import Admin from "../models/adminModel.js";
import { createNotification } from "../services/notificationService.js";

const OVERVIEW_CACHE_KEY = "platform:ops:overview";
const OVERVIEW_CACHE_TTL = 30;

async function getMongoStats() {
  if (mongoose.connection.readyState !== 1) {
    return {
      status: "disconnected",
      dataSizeBytes: 0,
      storageSizeBytes: 0,
      indexSizeBytes: 0,
      collections: 0,
    };
  }

  const db = mongoose.connection.db;
  const stats = await db.stats();
  const collections = await db.listCollections().toArray();

  return {
    status: "connected",
    dataSizeBytes: stats.dataSize || 0,
    storageSizeBytes: stats.storageSize || 0,
    indexSizeBytes: stats.indexSize || 0,
    collections: collections.length,
  };
}

async function getRedisStats() {
  if (!isRedisEnabled()) {
    return { status: "disabled", memoryBytes: 0 };
  }

  try {
    const redis = await getRedisClient();
    if (!redis) return { status: "disconnected", memoryBytes: 0 };
    await redis.ping();
    const info = await redis.info("memory");
    const match = info.match(/used_memory:(\d+)/);
    return {
      status: "connected",
      memoryBytes: match ? Number(match[1]) : 0,
    };
  } catch {
    return { status: "disconnected", memoryBytes: 0 };
  }
}

function getDeploymentInfo() {
  return {
    serviceName: process.env.RAILWAY_SERVICE_NAME || process.env.RENDER_SERVICE_NAME || "fzone-api",
    environment: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || "development",
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || "",
    gitCommit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "",
    gitBranch: process.env.RAILWAY_GIT_BRANCH || "",
    buildTime: process.env.BUILD_TIME || "",
    nodeVersion: process.version,
    hostname: os.hostname(),
  };
}

function resolveServerStatus({ maintenanceMode, mongoStatus, redisStatus }) {
  if (maintenanceMode) return "maintenance";
  if (mongoStatus !== "connected") return "degraded";
  if (redisStatus === "disconnected") return "degraded";
  return "ok";
}

export async function collectLiveMetrics() {
  const settings = await getOrgSettings();
  const platform = settings.platform || {};
  const plan = platform.plan || "free";
  const planLimits = platform.planLimits || getPlanLimits(plan);

  const mongo = await getMongoStats();
  const redis = await getRedisStats();
  const apiUsage = getApiUsageCounters();
  const storage = await getStorageUsageSnapshot();
  const load = os.loadavg();
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsed = memTotal - memFree;
  const processMem = process.memoryUsage();

  const [activeInvestors, adminCount] = await Promise.all([
    Investor.countDocuments({}),
    Admin.countDocuments({}),
  ]);

  const serverStatus = resolveServerStatus({
    maintenanceMode: platform.maintenanceMode,
    mongoStatus: mongo.status,
    redisStatus: redis.status,
  });

  return {
    serverStatus,
    maintenanceMode: Boolean(platform.maintenanceMode),
    maintenanceMessage: platform.maintenanceMessage || "",
    uptimeSeconds: Math.floor(process.uptime()),
    plan,
    planStatus: platform.planStatus || "active",
    planExpiresAt: platform.planExpiresAt || null,
    autoRenew: platform.autoRenew !== false,
    planLimits,
    planTierInfo: PLAN_TIER_DEFAULTS[plan] || PLAN_TIER_DEFAULTS.free,
    usage: {
      storageUsedBytes: storage.used,
      storageLimitBytes: planLimits.storageBytes,
      apiRequestsToday: apiUsage.apiRequestsToday,
      apiRequestsMonth: apiUsage.apiRequestsMonth,
      apiRequestsLimitMonth: planLimits.apiRequestsMonth,
      bandwidthBytesToday: apiUsage.bandwidthBytesToday,
      bandwidthBytesMonth: apiUsage.bandwidthBytesMonth,
      bandwidthLimitBytes: planLimits.bandwidthBytesMonth,
      adminCount,
      adminLimit: planLimits.maxAdmins,
    },
    system: {
      memoryUsedBytes: memUsed,
      memoryTotalBytes: memTotal,
      memoryUsedPercent: memTotal ? Math.round((memUsed / memTotal) * 100) : 0,
      processHeapUsedBytes: processMem.heapUsed,
      cpuLoad1: load[0] || 0,
      cpuLoad5: load[1] || 0,
      cpuLoad15: load[2] || 0,
    },
    mongo,
    redis,
    connections: {
      onlineNow: getOnlineConnectionCount(),
      activeInvestors,
    },
    deployment: getDeploymentInfo(),
    timestamp: new Date().toISOString(),
  };
}

export async function getOpsOverview(force = false) {
  if (!force) {
    const cached = await redisGet(OVERVIEW_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        /* ignore */
      }
    }
  }

  const overview = await collectLiveMetrics();
  await redisSetEx(OVERVIEW_CACHE_KEY, OVERVIEW_CACHE_TTL, JSON.stringify(overview));
  return overview;
}

export async function snapshotUsageMetric() {
  const live = await collectLiveMetrics();
  const doc = await UsageMetric.create({
    recordedAt: new Date(),
    serverStatus: live.serverStatus,
    uptimeSeconds: live.uptimeSeconds,
    memoryUsedBytes: live.system.memoryUsedBytes,
    memoryTotalBytes: live.system.memoryTotalBytes,
    processHeapUsedBytes: live.system.processHeapUsedBytes,
    cpuLoad1: live.system.cpuLoad1,
    cpuLoad5: live.system.cpuLoad5,
    cpuLoad15: live.system.cpuLoad15,
    mongoDataSizeBytes: live.mongo.dataSizeBytes,
    mongoStorageSizeBytes: live.mongo.storageSizeBytes,
    mongoIndexSizeBytes: live.mongo.indexSizeBytes,
    mongoCollections: live.mongo.collections,
    redisStatus: live.redis.status,
    apiRequestsToday: live.usage.apiRequestsToday,
    apiRequestsMonth: live.usage.apiRequestsMonth,
    bandwidthBytesToday: live.usage.bandwidthBytesToday,
    bandwidthBytesMonth: live.usage.bandwidthBytesMonth,
    onlineConnections: live.connections.onlineNow,
    activeInvestors: live.connections.activeInvestors,
  });

  await UsageMetric.deleteMany({
    recordedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  });

  return doc;
}

function parseRange(range = "24h") {
  const map = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const ms = map[range] || map["24h"];
  return { from: new Date(Date.now() - ms), range: range in map ? range : "24h" };
}

export async function getMetricsTimeSeries(range = "24h") {
  const { from, range: normalizedRange } = parseRange(range);
  const rows = await UsageMetric.find({ recordedAt: { $gte: from } })
    .sort({ recordedAt: 1 })
    .lean();

  return {
    range: normalizedRange,
    points: rows.map((row) => ({
      at: row.recordedAt,
      memoryUsedBytes: row.memoryUsedBytes,
      cpuLoad1: row.cpuLoad1,
      mongoStorageSizeBytes: row.mongoStorageSizeBytes,
      apiRequestsMonth: row.apiRequestsMonth,
      bandwidthBytesMonth: row.bandwidthBytesMonth,
      onlineConnections: row.onlineConnections,
      serverStatus: row.serverStatus,
    })),
  };
}

export async function listServerLogs({ page = 1, limit = 20 } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    ServerLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .lean(),
    ServerLog.countDocuments({}),
  ]);

  return { items, total, page, limit };
}

export async function listErrorLogs({ page = 1, limit = 20 } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = {
    $or: [
      { level: { $in: ["error", "critical"] } },
      { category: "webhook" },
    ],
  };

  const [serverLogs, auditLogs, serverTotal, auditTotal] = await Promise.all([
    ServerLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(limit, 50)).lean(),
    AuditLog.find({
      $or: [
        { action: { $regex: /fail|error/i } },
        { category: "webhook" },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 50))
      .lean(),
    ServerLog.countDocuments(filter),
    AuditLog.countDocuments({
      $or: [
        { action: { $regex: /fail|error/i } },
        { category: "webhook" },
      ],
    }),
  ]);

  const merged = [
    ...serverLogs.map((row) => ({
      id: String(row._id),
      source: "server",
      level: row.level,
      message: row.message,
      at: row.createdAt,
      metadata: row.metadata,
    })),
    ...auditLogs.map((row) => ({
      id: String(row._id),
      source: "audit",
      level: "error",
      message: row.action,
      at: row.createdAt,
      metadata: { category: row.category, actorEmail: row.actorEmail, ...row.metadata },
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);

  return {
    items: merged,
    total: serverTotal + auditTotal,
    page,
    limit,
  };
}

export async function setMaintenanceMode({ enabled, message }, actor) {
  const patch = {
    platform: {
      maintenanceMode: Boolean(enabled),
      maintenanceMessage: message || "",
    },
  };

  const updated = await updateOrgSettings(patch);

  await ServerLog.create({
    level: enabled ? "warn" : "info",
    source: "platform",
    message: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
    metadata: { actorEmail: actor?.email || actor?.Email || "" },
  });

  if (enabled) {
    createNotification("platform.maintenance_enabled", {
      message: message || "",
    }).catch(() => {});
  }

  return {
    maintenanceMode: updated.platform?.maintenanceMode,
    maintenanceMessage: updated.platform?.maintenanceMessage,
  };
}

export async function logServerEvent(level, message, metadata = {}) {
  return ServerLog.create({ level, message, metadata });
}

export function getDeploymentSnapshot() {
  return getDeploymentInfo();
}
