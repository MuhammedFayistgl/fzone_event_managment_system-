import OrgSettings from "../models/orgSettingsModel.js";

const DEFAULTS = {
  key: "default",
  refundAccessPolicy: "active_refunds",
  gateNames: ["Main Gate", "VIP Gate", "Side Gate"],
  notifications: {
    emailEnabled: false,
    smsEnabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioFromNumber: "",
  },
  waitlistEnabled: false,
};

let cached = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

export async function getOrgSettings(force = false) {
  const now = Date.now();
  if (!force && cached && now - cachedAt < CACHE_MS) {
    return cached;
  }

  let doc = await OrgSettings.findOne({ key: "default" }).lean();
  if (!doc) {
    doc = (await OrgSettings.create(DEFAULTS)).toObject();
  }

  cached = {
    ...DEFAULTS,
    ...doc,
    notifications: { ...DEFAULTS.notifications, ...(doc.notifications || {}) },
    gateNames: doc.gateNames?.length ? doc.gateNames : DEFAULTS.gateNames,
  };
  cachedAt = now;
  return cached;
}

export async function updateOrgSettings(patch = {}) {
  const update = {};

  if (patch.refundAccessPolicy) update.refundAccessPolicy = patch.refundAccessPolicy;
  if (Array.isArray(patch.gateNames)) update.gateNames = patch.gateNames.filter(Boolean);
  if (typeof patch.waitlistEnabled === "boolean") update.waitlistEnabled = patch.waitlistEnabled;
  if (patch.notifications && typeof patch.notifications === "object") {
    update.notifications = patch.notifications;
  }

  const doc = await OrgSettings.findOneAndUpdate(
    { key: "default" },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  cached = null;
  return getOrgSettings(true);
}

export function clearSettingsCache() {
  cached = null;
  cachedAt = 0;
}
