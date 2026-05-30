import mongoose from "mongoose";

const usageMetricSchema = new mongoose.Schema(
  {
    recordedAt: { type: Date, required: true, index: true },
    serverStatus: { type: String, default: "ok" },
    uptimeSeconds: { type: Number, default: 0 },
    memoryUsedBytes: { type: Number, default: 0 },
    memoryTotalBytes: { type: Number, default: 0 },
    processHeapUsedBytes: { type: Number, default: 0 },
    cpuLoad1: { type: Number, default: 0 },
    cpuLoad5: { type: Number, default: 0 },
    cpuLoad15: { type: Number, default: 0 },
    mongoDataSizeBytes: { type: Number, default: 0 },
    mongoStorageSizeBytes: { type: Number, default: 0 },
    mongoIndexSizeBytes: { type: Number, default: 0 },
    mongoCollections: { type: Number, default: 0 },
    redisStatus: { type: String, default: "unknown" },
    apiRequestsToday: { type: Number, default: 0 },
    apiRequestsMonth: { type: Number, default: 0 },
    bandwidthBytesToday: { type: Number, default: 0 },
    bandwidthBytesMonth: { type: Number, default: 0 },
    onlineConnections: { type: Number, default: 0 },
    activeInvestors: { type: Number, default: 0 },
  },
  { timestamps: true }
);

usageMetricSchema.index({ recordedAt: -1 });

export default mongoose.model("UsageMetric", usageMetricSchema);
