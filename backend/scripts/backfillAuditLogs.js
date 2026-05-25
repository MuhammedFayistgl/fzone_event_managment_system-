/**
 * Backfill AuditLog from historical payment refunds, blocks, and reconciliation.
 * Safe to re-run: skips entries that already exist (same action + targetId + createdAt day).
 *
 * Usage:
 *   node scripts/backfillAuditLogs.js
 *   node scripts/backfillAuditLogs.js --dry-run
 */
import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import RegEventModel from "../models/EventRegistrationModel.js";
import Admin from "../models/adminModel.js";
import AuditLog from "../models/auditLogModel.js";
import { ConnectionDB } from "../server/server.js";

const dryRun = process.argv.includes("--dry-run");

async function adminMap(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Map();
  const admins = await Admin.find({ _id: { $in: unique } })
    .select("email role")
    .lean();
  return new Map(admins.map((a) => [String(a._id), a]));
}

async function exists(action, targetId, createdAt) {
  if (!createdAt) return false;
  const dayStart = new Date(createdAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const count = await AuditLog.countDocuments({
    action,
    targetId: String(targetId),
    createdAt: { $gte: dayStart, $lt: dayEnd },
  });
  return count > 0;
}

async function insertEntry(entry) {
  if (dryRun) {
    console.log("[dry-run]", entry.action, entry.targetId, entry.createdAt);
    return "dry";
  }
  if (await exists(entry.action, entry.targetId, entry.createdAt)) {
    return "skip";
  }
  await AuditLog.create(entry);
  return "insert";
}

async function backfillRefunds() {
  const payments = await Payment.find({
    $or: [
      { "refunds.0": { $exists: true } },
      { refundAmount: { $gt: 0 } },
      { refundedAt: { $ne: null } },
    ],
  }).lean();

  const adminIds = payments.flatMap((p) => [
    p.refundedBy,
    ...(p.refunds || []).map((r) => r.refundedBy),
  ]);
  const admins = await adminMap(adminIds);

  let inserted = 0;
  let skipped = 0;

  for (const payment of payments) {
    const refunds = payment.refunds?.length
      ? payment.refunds
      : payment.refundAmount > 0
        ? [
            {
              amount: payment.refundAmount,
              reason: payment.refundReason || "legacy_refund",
              note: "",
              refundedBy: payment.refundedBy,
              refundedAt: payment.refundedAt || payment.updatedAt,
            },
          ]
        : [];

    for (const refund of refunds) {
      const admin = admins.get(String(refund.refundedBy || payment.refundedBy || ""));
      const createdAt = refund.refundedAt || refund.processedAt || payment.updatedAt;
      const result = await insertEntry({
        action: "payment.refund",
        category: "refund",
        actorId: admin?._id || refund.refundedBy || payment.refundedBy || null,
        actorEmail: admin?.email || "",
        actorRole: admin?.role || "",
        targetType: "payment",
        targetId: String(payment._id),
        eventId: payment.eventId,
        phone: payment.phone || "",
        metadata: {
          amount: refund.amount,
          reason: refund.reason,
          note: refund.note || "",
          backfilled: true,
        },
        createdAt,
        updatedAt: createdAt,
      });
      if (result === "insert") inserted += 1;
      else if (result === "skip") skipped += 1;
    }
  }

  return { inserted, skipped, scanned: payments.length };
}

async function backfillBlocks() {
  const registrations = await RegEventModel.find({
    $or: [{ isBlocked: true }, { "participants.isBlocked": true }],
  }).lean();

  let inserted = 0;
  let skipped = 0;

  for (const reg of registrations) {
    if (reg.isBlocked) {
      const createdAt = reg.blockedAt || reg.updatedAt;
      const result = await insertEntry({
        action: "registration.block",
        category: "block",
        actorEmail: "",
        actorRole: "",
        targetType: "investor",
        targetId: String(reg._id),
        eventId: reg.eventId,
        phone: reg.phone || "",
        metadata: { reason: reg.blockedReason || "", backfilled: true },
        createdAt,
        updatedAt: createdAt,
      });
      if (result === "insert") inserted += 1;
      else if (result === "skip") skipped += 1;
    }

    for (let guestIndex = 0; guestIndex < (reg.participants || []).length; guestIndex += 1) {
      const guest = reg.participants[guestIndex];
      if (!guest.isBlocked) continue;
      const createdAt = guest.blockedAt || reg.updatedAt;
      const result = await insertEntry({
        action: "registration.block",
        category: "block",
        actorEmail: "",
        actorRole: "",
        targetType: "guest",
        targetId: String(reg._id),
        eventId: reg.eventId,
        phone: reg.phone || "",
        metadata: {
          guestIndex,
          reason: guest.blockedReason || "",
          backfilled: true,
        },
        createdAt,
        updatedAt: createdAt,
      });
      if (result === "insert") inserted += 1;
      else if (result === "skip") skipped += 1;
    }
  }

  return { inserted, skipped, scanned: registrations.length };
}

async function backfillReconciliation() {
  const payments = await Payment.find({
    reconciliationReviewedAt: { $ne: null },
  }).lean();

  let inserted = 0;
  let skipped = 0;

  for (const payment of payments) {
    const createdAt = payment.reconciliationReviewedAt;
    const result = await insertEntry({
      action: "reconciliation.resolve",
      category: "payment",
      actorEmail: "",
      actorRole: "",
      targetType: "payment",
      targetId: String(payment._id),
      eventId: payment.eventId,
      phone: payment.phone || "",
      metadata: {
        note: payment.reconciliationNote || "",
        backfilled: true,
      },
      createdAt,
      updatedAt: createdAt,
    });
    if (result === "insert") inserted += 1;
    else if (result === "skip") skipped += 1;
  }

  return { inserted, skipped, scanned: payments.length };
}

async function main() {
  await ConnectionDB();
  console.log(dryRun ? "DRY RUN — no writes" : "Backfilling audit logs…");

  const refunds = await backfillRefunds();
  const blocks = await backfillBlocks();
  const recon = await backfillReconciliation();
  const total = await AuditLog.countDocuments();

  console.log(JSON.stringify({ refunds, blocks, recon, totalAfter: total }, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
