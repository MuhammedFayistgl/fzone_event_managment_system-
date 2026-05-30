import SubscriptionPlan from "../models/subscriptionPlanModel.js";
import PlatformSubscription from "../models/platformSubscriptionModel.js";
import PlatformInvoice from "../models/platformInvoiceModel.js";
import { getOrgSettings, updateOrgSettings } from "../utils/appSettings.js";
import { PLAN_TIER_DEFAULTS, PLAN_TIERS, getPlanLimits } from "../constants/platformPlans.js";
import razorpay, { isRazorpayConfigured } from "../utils/razorpayClient.js";
import { logAuditAction } from "../utils/auditLog.js";
import { createNotification } from "../services/notificationService.js";
import { recordWebhookDelivery } from "../controllers/platformController.js";
import Payment from "../models/paymentModel.js";
import UsageMetric from "../models/usageMetricModel.js";

function invoiceNumber() {
  return `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function ensureSubscriptionPlansSeeded() {
  for (let i = 0; i < PLAN_TIERS.length; i += 1) {
    const tier = PLAN_TIERS[i];
    const defaults = PLAN_TIER_DEFAULTS[tier];
    await SubscriptionPlan.findOneAndUpdate(
      { tier },
      {
        tier,
        label: defaults.label,
        description: `${defaults.label} platform plan`,
        storageBytes: defaults.storageBytes,
        apiRequestsMonth: defaults.apiRequestsMonth,
        maxAdmins: defaults.maxAdmins,
        bandwidthBytesMonth: defaults.bandwidthBytesMonth,
        priceMonthlyInr: defaults.priceMonthlyInr,
        priceYearlyInr: defaults.priceYearlyInr,
        features: [
          `${Math.round(defaults.storageBytes / (1024 * 1024))} MB storage`,
          `${defaults.apiRequestsMonth.toLocaleString()} API requests / month`,
          `${defaults.maxAdmins} admin seats`,
        ],
        active: true,
        sortOrder: i,
      },
      { upsert: true, new: true }
    );
  }
}

export async function listSubscriptionPlans() {
  await ensureSubscriptionPlansSeeded();
  return SubscriptionPlan.find({ active: true }).sort({ sortOrder: 1 }).lean();
}

export async function getBillingOverview() {
  const settings = await getOrgSettings();
  const platform = settings.platform || {};
  const subscription =
    (await PlatformSubscription.findOne({ orgKey: "default" }).lean()) ||
    {
      tier: platform.plan || "free",
      status: platform.planStatus || "active",
      billingCycle: "none",
      autoRenew: platform.autoRenew !== false,
      currentPeriodEnd: platform.planExpiresAt,
    };

  const [plans, invoices, paidInvoiceTotal, eventRevenueAgg] = await Promise.all([
    listSubscriptionPlans(),
    PlatformInvoice.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    PlatformInvoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amountInr" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const planDistribution = await PlatformSubscription.aggregate([
    { $group: { _id: "$tier", count: { $sum: 1 } } },
  ]);

  return {
    currentPlan: platform.plan || subscription.tier || "free",
    planStatus: platform.planStatus || subscription.status || "active",
    planExpiresAt: platform.planExpiresAt || subscription.currentPeriodEnd || null,
    autoRenew: platform.autoRenew !== false,
    billingCycle: subscription.billingCycle || "none",
    plans,
    recentInvoices: invoices,
    revenue: {
      platformPaidInr: paidInvoiceTotal[0]?.total || 0,
      eventPaymentsInr: eventRevenueAgg[0]?.total || 0,
    },
    planDistribution: planDistribution.map((row) => ({
      tier: row._id,
      count: row.count,
    })),
    razorpayConfigured: isRazorpayConfigured(),
  };
}

async function applyPlanToOrg(tier, extras = {}) {
  const limits = getPlanLimits(tier);
  await updateOrgSettings({
    platform: {
      plan: tier,
      planLimits: limits,
      planStatus: extras.status || "active",
      planExpiresAt: extras.planExpiresAt || null,
      autoRenew: extras.autoRenew !== false,
    },
  });
}

export async function subscribeToPlan({ tier, billingCycle = "monthly" }, actor, req) {
  if (!PLAN_TIERS.includes(tier)) {
    throw Object.assign(new Error("Invalid plan tier"), { statusCode: 400 });
  }

  const plan = await SubscriptionPlan.findOne({ tier }).lean();
  if (!plan) {
    throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
  }

  if (tier === "free") {
    await PlatformSubscription.findOneAndUpdate(
      { orgKey: "default" },
      {
        tier: "free",
        status: "active",
        billingCycle: "none",
        autoRenew: false,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelledAt: null,
        pausedAt: null,
      },
      { upsert: true, new: true }
    );
    await applyPlanToOrg("free", { status: "active", planExpiresAt: null, autoRenew: false });
    return { success: true, message: "Downgraded to Free plan", tier: "free" };
  }

  const amountInr =
    billingCycle === "yearly" ? plan.priceYearlyInr : plan.priceMonthlyInr;

  const periodEnd = new Date();
  if (billingCycle === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  let razorpayOrderId = "";
  if (isRazorpayConfigured() && amountInr > 0) {
    const order = await razorpay.orders.create({
      amount: amountInr * 100,
      currency: "INR",
      receipt: `platform_${tier}_${Date.now()}`,
      notes: { tier, billingCycle, type: "platform_subscription" },
    });
    razorpayOrderId = order.id;
  }

  const invoice = await PlatformInvoice.create({
    invoiceNumber: invoiceNumber(),
    tier,
    billingCycle,
    amountInr,
    status: amountInr > 0 ? "open" : "paid",
    dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    razorpayOrderId,
    paidAt: amountInr > 0 ? null : new Date(),
  });

  if (amountInr === 0) {
    await PlatformSubscription.findOneAndUpdate(
      { orgKey: "default" },
      {
        tier,
        status: "active",
        billingCycle,
        autoRenew: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      { upsert: true, new: true }
    );
    await applyPlanToOrg(tier, { status: "active", planExpiresAt: periodEnd, autoRenew: true });
  }

  await logAuditAction({
    action: "platform.subscribe",
    category: "settings",
    actor,
    metadata: { tier, billingCycle, invoiceId: String(invoice._id) },
    req,
  });

  return {
    success: true,
    tier,
    billingCycle,
    invoice,
    razorpayOrderId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    amountInr,
  };
}

export async function pauseSubscription(actor, req) {
  const sub = await PlatformSubscription.findOneAndUpdate(
    { orgKey: "default" },
    { status: "paused", pausedAt: new Date() },
    { new: true, upsert: true }
  );
  await updateOrgSettings({ platform: { planStatus: "paused" } });
  await logAuditAction({
    action: "platform.subscription_paused",
    category: "settings",
    actor,
    req,
  });
  return sub;
}

export async function resumeSubscription(actor, req) {
  const sub = await PlatformSubscription.findOneAndUpdate(
    { orgKey: "default" },
    { status: "active", pausedAt: null },
    { new: true, upsert: true }
  );
  await updateOrgSettings({ platform: { planStatus: "active" } });
  await logAuditAction({
    action: "platform.subscription_resumed",
    category: "settings",
    req,
    actor,
  });
  return sub;
}

export async function cancelSubscription(actor, req) {
  const sub = await PlatformSubscription.findOneAndUpdate(
    { orgKey: "default" },
    { status: "cancelled", cancelledAt: new Date(), autoRenew: false },
    { new: true, upsert: true }
  );
  await applyPlanToOrg("free", {
    status: "cancelled",
    planExpiresAt: null,
    autoRenew: false,
  });
  await PlatformSubscription.findOneAndUpdate(
    { orgKey: "default" },
    { tier: "free", billingCycle: "none" }
  );
  await logAuditAction({
    action: "platform.subscription_cancelled",
    category: "settings",
    actor,
    req,
  });
  createNotification("platform.subscription_cancelled", { actor }).catch(() => {});
  return sub;
}

export async function listInvoices({ page = 1, limit = 20 } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    PlatformInvoice.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PlatformInvoice.countDocuments({}),
  ]);
  return { items, total, page, limit };
}

export async function retryInvoicePayment(invoiceId, actor, req) {
  const invoice = await PlatformInvoice.findById(invoiceId);
  if (!invoice) {
    throw Object.assign(new Error("Invoice not found"), { statusCode: 404 });
  }
  if (invoice.status === "paid") {
    return { success: true, message: "Invoice already paid", invoice };
  }

  if (!isRazorpayConfigured()) {
    throw Object.assign(new Error("Razorpay not configured"), { statusCode: 503 });
  }

  const order = await razorpay.orders.create({
    amount: invoice.amountInr * 100,
    currency: "INR",
    receipt: `retry_${invoice.invoiceNumber}`,
    notes: { tier: invoice.tier, type: "platform_subscription_retry" },
  });

  invoice.razorpayOrderId = order.id;
  invoice.status = "open";
  await invoice.save();

  await logAuditAction({
    action: "platform.invoice_retry",
    category: "payment",
    actor,
    metadata: { invoiceId: String(invoice._id) },
    req,
  });

  return {
    success: true,
    invoice,
    razorpayOrderId: order.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    amountInr: invoice.amountInr,
  };
}

export async function confirmPlatformPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const invoice = await PlatformInvoice.findOne({ razorpayOrderId });
  if (!invoice) {
    throw Object.assign(new Error("Invoice not found for order"), { statusCode: 404 });
  }

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.razorpayPaymentId = razorpayPaymentId || "";
  await invoice.save();

  const periodEnd = new Date();
  if (invoice.billingCycle === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await PlatformSubscription.findOneAndUpdate(
    { orgKey: "default" },
    {
      tier: invoice.tier,
      status: "active",
      billingCycle: invoice.billingCycle,
      autoRenew: true,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelledAt: null,
      pausedAt: null,
    },
    { upsert: true }
  );

  await applyPlanToOrg(invoice.tier, {
    status: "active",
    planExpiresAt: periodEnd,
    autoRenew: true,
  });

  createNotification("platform.payment_success", {
    tier: invoice.tier,
    amountInr: invoice.amountInr,
  }).catch(() => {});

  return invoice;
}

export async function handlePlatformBillingWebhook(event) {
  const eventType = event?.event || event?.type || "unknown";

  await recordWebhookDelivery({
    eventType: `platform.${eventType}`,
    status: "received",
    payloadSummary: { provider: "razorpay_platform" },
  });

  try {
    if (eventType === "payment.captured" || eventType === "invoice.paid") {
      const payment = event.payload?.payment?.entity || event.payload?.invoice?.entity;
      const orderId = payment?.order_id || payment?.order_id;
      if (orderId) {
        await confirmPlatformPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: payment?.id,
        });
      }
    }

    if (eventType === "payment.failed" || eventType === "invoice.failed") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        const invoice = await PlatformInvoice.findOneAndUpdate(
          { razorpayOrderId: orderId },
          {
            status: "failed",
            failureReason: payment?.error_description || "Payment failed",
          },
          { new: true }
        );
        if (invoice) {
          await applyPlanToOrg("free", { status: "past_due", autoRenew: false });
          await PlatformSubscription.findOneAndUpdate(
            { orgKey: "default" },
            { status: "past_due" }
          );
          createNotification("platform.payment_failed", {
            tier: invoice.tier,
            amountInr: invoice.amountInr,
          }).catch(() => {});
        }
      }
    }

    if (eventType === "subscription.cancelled") {
      await cancelSubscription(null, null);
    }

    await recordWebhookDelivery({
      eventType: `platform.${eventType}`,
      status: "processed",
      payloadSummary: { provider: "razorpay_platform" },
    });
  } catch (err) {
    await recordWebhookDelivery({
      eventType: `platform.${eventType}`,
      status: "failed",
      errorMessage: err.message,
      payloadSummary: { provider: "razorpay_platform" },
    });
    throw err;
  }
}

export async function getAnalyticsData(range = "30d") {
  const billing = await getBillingOverview();
  const msMap = { "24h": 1, "7d": 7, "30d": 30 };
  const days = msMap[range] || 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const metrics = await UsageMetric.find({ recordedAt: { $gte: from } })
    .sort({ recordedAt: 1 })
    .lean();

  const revenueByMonth = await PlatformInvoice.aggregate([
    { $match: { status: "paid", paidAt: { $gte: from } } },
    {
      $group: {
        _id: {
          year: { $year: "$paidAt" },
          month: { $month: "$paidAt" },
        },
        total: { $sum: "$amountInr" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return {
    billing,
    metrics: metrics.map((m) => ({
      at: m.recordedAt,
      apiRequestsMonth: m.apiRequestsMonth,
      mongoStorageSizeBytes: m.mongoStorageSizeBytes,
      onlineConnections: m.onlineConnections,
      bandwidthBytesMonth: m.bandwidthBytesMonth,
    })),
    revenueByMonth: revenueByMonth.map((row) => ({
      label: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      total: row.total,
    })),
  };
}

export async function toggleAutoRenew(enabled, actor, req) {
  await PlatformSubscription.findOneAndUpdate(
    { orgKey: "default" },
    { autoRenew: Boolean(enabled) },
    { upsert: true }
  );
  await updateOrgSettings({ platform: { autoRenew: Boolean(enabled) } });
  await logAuditAction({
    action: "platform.auto_renew_updated",
    category: "settings",
    actor,
    metadata: { autoRenew: Boolean(enabled) },
    req,
  });
  return { autoRenew: Boolean(enabled) };
}
