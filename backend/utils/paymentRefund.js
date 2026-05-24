import RegEventModel from "../models/EventRegistrationModel.js";
import Payment from "../models/paymentModel.js";
import eventModel from "../models/eventModel.js";
import { emitRegistrationBlocked } from "../live/liveHub.js";
import { normalizePhone, registrationPhoneQuery } from "./phone.js";
import { calculateRegistrationTotal, sumSuccessfulPayments } from "./pricing.js";
import { getOrgSettings } from "./appSettings.js";

export function getNetPaymentForAccess(payment, policy = "active_refunds") {
  if (!payment) return 0;
  if (payment.status !== "success" && payment.status !== "refunded") return 0;

  const amount = Number(payment.amount || 0);
  const refundDeduction =
    policy === "processed_only"
      ? getProcessedRefundTotal(payment)
      : getActiveRefundTotal(payment);

  return Math.max(0, amount - refundDeduction);
}

export async function sumPaymentsForAccess(payments = []) {
  const settings = await getOrgSettings();
  const policy = settings.refundAccessPolicy || "active_refunds";

  return (payments || [])
    .filter((payment) => payment?.status === "success" || payment?.status === "refunded")
    .reduce((sum, payment) => sum + getNetPaymentForAccess(payment, policy), 0);
}

export const REFUND_ACCESS_BLOCK_REASON =
  "Payment balance insufficient after refund";

export const REFUND_REASONS = [
  "duplicate_payment",
  "event_cancelled",
  "customer_request",
  "other",
];

export const REFUND_STATUSES = ["pending", "processed", "failed"];

function normalizeRefundStatus(status) {
  const value = String(status || "pending").toLowerCase();
  return REFUND_STATUSES.includes(value) ? value : "pending";
}

export function getActiveRefundTotal(payment) {
  return (payment?.refunds || [])
    .filter((entry) => entry.status !== "failed")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

export function getProcessedRefundTotal(payment) {
  return (payment?.refunds || [])
    .filter((entry) => entry.status === "processed")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

export function getRefundableRemaining(payment) {
  const amount = Number(payment?.amount || 0);
  return Math.max(0, amount - getActiveRefundTotal(payment));
}

export function getNetPaymentAmount(payment) {
  if (!payment || payment.status === "refunded") return 0;
  if (payment.status !== "success") return 0;
  return Math.max(0, Number(payment.amount || 0) - getActiveRefundTotal(payment));
}

export function getLatestRefundStatus(payment) {
  const refunds = payment?.refunds || [];
  if (!refunds.length) return null;
  return refunds[refunds.length - 1]?.status || null;
}

function syncPaymentRefundAggregate(payment) {
  payment.refundAmount = getActiveRefundTotal(payment);

  const refunds = payment.refunds || [];
  const latestActive = [...refunds].reverse().find((entry) => entry.status !== "failed");

  if (latestActive) {
    payment.refundId = latestActive.refundId;
    payment.refundReason = latestActive.reason;
    payment.refundedAt = latestActive.processedAt || latestActive.refundedAt || latestActive.initiatedAt;
  } else {
    payment.refundId = undefined;
    payment.refundReason = undefined;
    payment.refundedAt = undefined;
  }

  if (payment.refundAmount >= Number(payment.amount || 0) - 0.001) {
    payment.status = "refunded";
  } else if (payment.status === "refunded") {
    payment.status = "success";
  }
}

function findRefundEntry(payment, refundId) {
  return (payment.refunds || []).find((entry) => entry.refundId === refundId) || null;
}

function buildRefundEntry({
  refundId,
  amount,
  reason,
  note = "",
  refundedBy = null,
  status = "pending",
  razorpayReceipt = "",
  speedRequested = "",
  speedProcessed = "",
  failureReason = "",
  initiatedAt = null,
  processedAt = null,
}) {
  const normalizedStatus = normalizeRefundStatus(status);
  return {
    refundId,
    amount: Number(amount),
    reason: reason || "other",
    note: String(note || "").trim(),
    status: normalizedStatus,
    razorpayReceipt: razorpayReceipt ? String(razorpayReceipt) : "",
    speedRequested: speedRequested ? String(speedRequested) : "",
    speedProcessed: speedProcessed ? String(speedProcessed) : "",
    failureReason: failureReason ? String(failureReason) : "",
    initiatedAt: initiatedAt || new Date(),
    processedAt:
      processedAt || (normalizedStatus === "processed" ? new Date() : null),
    refundedBy,
    refundedAt: new Date(),
  };
}

/**
 * Apply a refund entry idempotently (skips if refundId already recorded).
 */
export async function applyRefundToPayment(
  payment,
  {
    refundId,
    amount,
    reason,
    note = "",
    refundedBy = null,
    status = "pending",
    razorpayReceipt = "",
    speedRequested = "",
    speedProcessed = "",
    failureReason = "",
    initiatedAt = null,
    processedAt = null,
  }
) {
  const refundAmount = Number(amount);
  if (!refundId || !Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new Error("Invalid refund payload");
  }

  const normalizedStatus = normalizeRefundStatus(status);
  const existing = findRefundEntry(payment, refundId);

  if (existing) {
    if (normalizedStatus === "processed" && existing.status !== "processed") {
      existing.status = "processed";
      existing.processedAt = processedAt || new Date();
      if (razorpayReceipt) existing.razorpayReceipt = String(razorpayReceipt);
      if (speedProcessed) existing.speedProcessed = String(speedProcessed);
      syncPaymentRefundAggregate(payment);
      await payment.save();
      return { payment, applied: true, updated: true };
    }
    return { payment, applied: false, updated: false };
  }

  if (normalizedStatus !== "failed") {
    const remaining = getRefundableRemaining(payment);
    if (refundAmount > remaining + 0.001) {
      throw new Error(`Refund amount exceeds remaining refundable balance (${remaining})`);
    }
  }

  if (!payment.refunds) payment.refunds = [];
  payment.refunds.push(
    buildRefundEntry({
      refundId,
      amount: refundAmount,
      reason,
      note,
      refundedBy,
      status: normalizedStatus,
      razorpayReceipt,
      speedRequested,
      speedProcessed,
      failureReason,
      initiatedAt,
      processedAt,
    })
  );

  if (refundedBy) payment.refundedBy = refundedBy;
  syncPaymentRefundAggregate(payment);
  await payment.save();
  return { payment, applied: true, updated: false };
}

export async function updateRefundStatus(
  payment,
  refundId,
  { status, failureReason = "", processedAt = null, razorpayReceipt = "", speedProcessed = "" }
) {
  const entry = findRefundEntry(payment, refundId);
  if (!entry) {
    return { payment, updated: false };
  }

  const nextStatus = normalizeRefundStatus(status);
  if (entry.status === nextStatus) {
    return { payment, updated: false };
  }

  if (nextStatus === "failed") {
    return reverseFailedRefund(payment, refundId, failureReason);
  }

  entry.status = nextStatus;
  if (failureReason) entry.failureReason = String(failureReason);
  if (razorpayReceipt) entry.razorpayReceipt = String(razorpayReceipt);
  if (speedProcessed) entry.speedProcessed = String(speedProcessed);
  if (nextStatus === "processed") {
    entry.processedAt = processedAt || new Date();
  }

  syncPaymentRefundAggregate(payment);
  await payment.save();
  return { payment, updated: true };
}

export async function reverseFailedRefund(payment, refundId, failureReason = "") {
  const entry = findRefundEntry(payment, refundId);
  if (!entry) {
    return { payment, updated: false };
  }

  if (entry.status === "failed") {
    return { payment, updated: false };
  }

  entry.status = "failed";
  entry.failureReason = String(failureReason || entry.failureReason || "Refund failed at Razorpay");
  entry.processedAt = null;

  syncPaymentRefundAggregate(payment);
  await payment.save();
  return { payment, updated: true };
}

export function mapRefundEntry(entry) {
  return {
    refundId: entry.refundId,
    amount: entry.amount,
    reason: entry.reason,
    note: entry.note || "",
    status: entry.status || "pending",
    razorpayReceipt: entry.razorpayReceipt || "",
    speedRequested: entry.speedRequested || "",
    speedProcessed: entry.speedProcessed || "",
    failureReason: entry.failureReason || "",
    initiatedAt: entry.initiatedAt || entry.refundedAt || null,
    processedAt: entry.processedAt || null,
    refundedAt: entry.refundedAt || null,
  };
}

export function getPaymentRefundStatus(payment) {
  const amount = Number(payment?.amount || 0);
  const activeRefund = getActiveRefundTotal(payment);
  if (activeRefund <= 0) return "none";
  if (payment?.status === "refunded" || activeRefund >= amount - 0.001) {
    const latest = getLatestRefundStatus(payment);
    return latest === "pending" ? "pending" : "full";
  }
  const latest = getLatestRefundStatus(payment);
  if (latest === "pending") return "pending";
  return "partial";
}

export function mapUserRefundEntry(entry) {
  return {
    amount: Number(entry.amount || 0),
    status: entry.status || "pending",
    processedAt: entry.processedAt || null,
    initiatedAt: entry.initiatedAt || entry.refundedAt || null,
  };
}

export function formatUserPaymentRecord(payment) {
  const amount = Number(payment?.amount || 0);
  const refundAmount = getActiveRefundTotal(payment);
  const netAmount = Math.max(0, amount - refundAmount);

  return {
    amount,
    netAmount,
    refundAmount,
    refundStatus: getPaymentRefundStatus(payment),
    guestCount: payment?.guestCount ?? 0,
    paidAt: payment?.paidAt || null,
    razorpay_order_id: payment?.razorpay_order_id || null,
    orderId: payment?.razorpay_order_id || null,
  };
}

export function buildUserRefundSummary(payments = []) {
  let grossPaidTotal = 0;
  let totalRefunded = 0;
  const refunds = [];

  for (const payment of payments) {
    if (payment?.status !== "success" && payment?.status !== "refunded") continue;

    grossPaidTotal += Number(payment.amount || 0);
    totalRefunded += getActiveRefundTotal(payment);

    for (const entry of payment.refunds || []) {
      if (entry.status === "failed") continue;
      refunds.push(mapUserRefundEntry(entry));
    }
  }

  const successLike = payments.filter(
    (payment) => payment?.status === "success" || payment?.status === "refunded"
  );
  const paidTotal = successLike.reduce((sum, payment) => {
    if (payment.status === "refunded") return sum;
    return sum + Math.max(0, Number(payment.amount || 0) - getActiveRefundTotal(payment));
  }, 0);

  let refundStatus = "none";
  if (totalRefunded > 0) {
    const hasPending = refunds.some((entry) => entry.status === "pending");
    if (paidTotal <= 0.001) {
      refundStatus = hasPending ? "pending" : "full";
    } else if (hasPending) {
      refundStatus = "pending";
    } else {
      refundStatus = "partial";
    }
  }

  return {
    grossPaidTotal,
    totalRefunded,
    paidTotal,
    refundStatus,
    refunds,
  };
}

export function sanitizeBlockedReasonForUser(reason = "") {
  const text = String(reason || "").trim();
  if (!text) return "Your registration access has been revoked.";
  if (/refund/i.test(text)) {
    return "Access revoked due to a payment refund. Contact support if you need help.";
  }
  return text;
}

export function isRefundManagedBlock(reason = "") {
  const text = String(reason || "").trim();
  if (!text) return false;
  if (text === REFUND_ACCESS_BLOCK_REASON) return true;
  return /refund/i.test(text);
}

export function computeAccessCoverage(event, paidTotal, guestCount) {
  const guests = Math.max(0, Number(guestCount) || 0);
  const paid = Math.max(0, Number(paidTotal) || 0);

  const { total: investorRequired } = calculateRegistrationTotal(event, 0);
  const investorCovered = paid >= investorRequired - 0.001;

  const guestCovered = [];
  for (let i = 1; i <= guests; i++) {
    const { total: cumulative } = calculateRegistrationTotal(event, i);
    const { total: prev } = calculateRegistrationTotal(event, i - 1);
    const marginal = cumulative - prev;

    if (marginal <= 0) {
      guestCovered.push(true);
    } else {
      guestCovered.push(paid >= cumulative - 0.001);
    }
  }

  const { total: requiredTotal } = calculateRegistrationTotal(event, guests);
  const coveredGuestCount = guestCovered.filter(Boolean).length;
  const guestsBlocked = guestCovered
    .map((covered, idx) => (!covered ? idx + 1 : null))
    .filter((value) => value != null);

  return {
    investorCovered,
    investorBlocked: !investorCovered,
    guestCovered,
    guestsBlocked,
    paidTotal: paid,
    requiredTotal,
    coveredGuestCount,
    investorRequired,
  };
}

export function buildAccessImpactMessage(coverage, registration = null) {
  const parts = [];

  if (coverage.investorBlocked) {
    parts.push("Investor entry will be blocked");
  }

  if (coverage.guestsBlocked.length) {
    const labels = coverage.guestsBlocked.map((guestNumber) => {
      const participant = registration?.participants?.[guestNumber - 1];
      return participant?.name
        ? `Guest ${guestNumber} (${participant.name})`
        : `Guest ${guestNumber}`;
    });
    parts.push(`${labels.join(", ")} will lose entry access`);
  }

  if (!parts.length) {
    return "All passes remain allowed after this refund";
  }

  return parts.join(". ");
}

export function formatAccessImpact(coverage, registration = null) {
  return {
    paidTotal: coverage.paidTotal,
    requiredTotal: coverage.requiredTotal,
    coveredGuestCount: coverage.coveredGuestCount,
    investorBlocked: coverage.investorBlocked,
    guestsBlocked: coverage.guestsBlocked,
    message: buildAccessImpactMessage(coverage, registration),
  };
}

async function loadRegistrationAccessContext(eventId, phone) {
  const normalized = normalizePhone(phone);
  const phoneQuery = normalized.valid
    ? registrationPhoneQuery(normalized)
    : { phone: String(phone) };

  const [registration, event, payments] = await Promise.all([
    RegEventModel.findOne({ eventId, ...phoneQuery }),
    eventModel.findById(eventId).lean(),
    Payment.find({
      eventId,
      ...phoneQuery,
      status: { $in: ["success", "refunded"] },
    }),
  ]);

  const paidTotal = await sumPaymentsForAccess(payments);
  const guestCount = registration?.participants?.length || 0;

  return { registration, event, paidTotal, guestCount, payments };
}

export async function previewAccessAfterRefund(
  eventId,
  phone,
  additionalRefundAmount = 0
) {
  const { registration, event, paidTotal, guestCount } =
    await loadRegistrationAccessContext(eventId, phone);

  if (!registration || !event) return null;

  const adjustedPaid = Math.max(
    0,
    paidTotal - Math.max(0, Number(additionalRefundAmount) || 0)
  );
  const coverage = computeAccessCoverage(event, adjustedPaid, guestCount);
  return formatAccessImpact(coverage, registration);
}

export async function syncAccessAfterRefund(eventId, phone, { reason = "" } = {}) {
  const { registration, event, paidTotal, guestCount } =
    await loadRegistrationAccessContext(eventId, phone);

  if (!registration || !event) return null;

  const blockReason = String(reason || "").trim() || REFUND_ACCESS_BLOCK_REASON;
  const coverage = computeAccessCoverage(event, paidTotal, guestCount);
  let changed = false;

  const investorManualBlock =
    registration.isBlocked && !isRefundManagedBlock(registration.blockedReason);

  if (!investorManualBlock) {
    const shouldBlock = !coverage.investorCovered;

    if (registration.isBlocked !== shouldBlock) {
      registration.isBlocked = shouldBlock;
      registration.blockedAt = shouldBlock ? new Date() : null;
      registration.blockedReason = shouldBlock ? blockReason : "";
      changed = true;

      emitRegistrationBlocked({
        eventId: String(registration.eventId),
        registrationId: String(registration._id),
        phone: registration.phone,
        target: "investor",
        guestIndex: null,
        participantId: null,
        isBlocked: shouldBlock,
        blockedReason: shouldBlock ? blockReason : "",
      });
    } else if (shouldBlock && registration.blockedReason !== blockReason) {
      registration.blockedReason = blockReason;
      changed = true;
    }
  }

  const participants = registration.participants || [];
  for (let index = 0; index < participants.length; index++) {
    const participant = participants[index];
    const guestCovered = coverage.guestCovered[index] ?? true;
    const guestManualBlock =
      participant.isBlocked && !isRefundManagedBlock(participant.blockedReason);

    if (guestManualBlock) continue;

    const shouldBlock = !guestCovered;

    if (participant.isBlocked !== shouldBlock) {
      participant.isBlocked = shouldBlock;
      participant.blockedAt = shouldBlock ? new Date() : null;
      participant.blockedReason = shouldBlock ? blockReason : "";
      changed = true;

      emitRegistrationBlocked({
        eventId: String(registration.eventId),
        registrationId: String(registration._id),
        phone: registration.phone,
        target: "guest",
        guestIndex: index,
        participantId: String(participant._id || ""),
        isBlocked: shouldBlock,
        blockedReason: shouldBlock ? blockReason : "",
      });
    } else if (shouldBlock && participant.blockedReason !== blockReason) {
      participant.blockedReason = blockReason;
      changed = true;
    }
  }

  if (changed) {
    registration.markModified("participants");
    await registration.save();
  }

  const guestsBlocked = participants
    .map((participant, index) => (participant.isBlocked ? index + 1 : null))
    .filter((value) => value != null);

  return {
    paidTotal: coverage.paidTotal,
    requiredTotal: coverage.requiredTotal,
    coveredGuestCount: coverage.coveredGuestCount,
    investorBlocked: Boolean(registration.isBlocked),
    guestsBlocked,
    message: buildAccessImpactMessage(
      {
        ...coverage,
        investorBlocked: Boolean(registration.isBlocked),
        guestsBlocked,
      },
      registration
    ),
  };
}

export async function processRefundWebhook(refundEntity, eventType = "") {
  const razorpayPaymentId = refundEntity?.payment_id;
  const refundId = refundEntity?.id;
  const refundAmountInr = Number(refundEntity?.amount || 0) / 100;

  if (!razorpayPaymentId || !refundId || refundAmountInr <= 0) {
    throw new Error("Invalid refund payload");
  }

  const payment = await Payment.findOne({ razorpay_payment_id: razorpayPaymentId });
  if (!payment) {
    throw new Error("Payment not found");
  }

  const notes = refundEntity?.notes || {};
  const reason = notes.reason || notes.refund_reason || "other";
  const note = notes.note || "";
  const normalizedEvent = String(eventType || "").toLowerCase();
  const entityStatus = String(refundEntity?.status || "pending").toLowerCase();
  const existing = findRefundEntry(payment, refundId);

  if (normalizedEvent === "refund.failed" || entityStatus === "failed") {
    if (!existing) {
      return { payment, changed: false };
    }

    const result = await reverseFailedRefund(
      payment,
      refundId,
      refundEntity?.error_description || refundEntity?.failure_reason || "Refund failed at Razorpay"
    );
    return { payment: result.payment, changed: result.updated };
  }

  if (existing) {
    const nextStatus = normalizedEvent === "refund.processed" || entityStatus === "processed"
      ? "processed"
      : "pending";
    const result = await updateRefundStatus(payment, refundId, {
      status: nextStatus,
      processedAt: nextStatus === "processed" ? new Date() : null,
      razorpayReceipt: refundEntity?.receipt || "",
      speedProcessed: refundEntity?.speed_processed || "",
    });
    return { payment: result.payment, changed: result.updated };
  }

  const initialStatus =
    normalizedEvent === "refund.processed" || entityStatus === "processed"
      ? "processed"
      : "pending";

  const result = await applyRefundToPayment(payment, {
    refundId,
    amount: refundAmountInr,
    reason,
    note,
    status: initialStatus,
    razorpayReceipt: refundEntity?.receipt || "",
    speedRequested: refundEntity?.speed_requested || "",
    speedProcessed: refundEntity?.speed_processed || "",
    initiatedAt: refundEntity?.created_at
      ? new Date(Number(refundEntity.created_at) * 1000)
      : new Date(),
    processedAt: initialStatus === "processed" ? new Date() : null,
  });

  return { payment: result.payment, changed: result.applied || result.updated };
}

export async function revokeRegistrationAccess(eventId, phone, reason = "Payment refunded") {
  const normalized = normalizePhone(phone);
  const phoneQuery = normalized.valid
    ? registrationPhoneQuery(normalized)
    : { phone: String(phone) };

  const registration = await RegEventModel.findOne({ eventId, ...phoneQuery });
  if (!registration || registration.isBlocked) return null;

  registration.isBlocked = true;
  registration.blockedAt = new Date();
  registration.blockedReason = String(reason || "Payment refunded").trim();
  await registration.save();

  emitRegistrationBlocked({
    eventId: String(registration.eventId),
    registrationId: String(registration._id),
    phone: registration.phone,
    target: "investor",
    guestIndex: null,
    participantId: null,
    isBlocked: true,
    blockedReason: registration.blockedReason,
  });

  return registration;
}
