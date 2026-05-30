import OrgSettings from "../models/orgSettingsModel.js";
import {
  DEFAULT_PLATFORM_SETTINGS,
  getPlanLimits,
} from "../constants/platformPlans.js";
import { DEFAULT_ASSISTANT } from "../constants/registrationAssistant.js";

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
  registrationAssistant: { ...DEFAULT_ASSISTANT },
  platform: {
    ...DEFAULT_PLATFORM_SETTINGS,
    planLimits: getPlanLimits("free"),
  },
};

let cached = null;
let cachedAt = 0;
const CACHE_MS = 30_000;
const MASKED_SECRET = "********";

function mergeNotifications(existing = {}, patch = {}) {
  const merged = { ...DEFAULTS.notifications, ...existing, ...patch };

  if (!patch.smtpPass || patch.smtpPass === MASKED_SECRET) {
    merged.smtpPass = existing.smtpPass ?? DEFAULTS.notifications.smtpPass;
  }
  if (!patch.twilioAuthToken || patch.twilioAuthToken === MASKED_SECRET) {
    merged.twilioAuthToken =
      existing.twilioAuthToken ?? DEFAULTS.notifications.twilioAuthToken;
  }

  return merged;
}

function mergePlatform(docPlatform = {}) {
  const plan = docPlatform.plan || "free";
  return {
    ...DEFAULTS.platform,
    ...docPlatform,
    planLimits: {
      ...getPlanLimits(plan),
      ...(docPlatform.planLimits || {}),
    },
  };
}

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
    registrationAssistant: {
      ...DEFAULTS.registrationAssistant,
      ...(doc.registrationAssistant || {}),
    },
    platform: mergePlatform(doc.platform),
  };
  cachedAt = now;
  return cached;
}

export async function updateOrgSettings(patch = {}) {
  const update = {};

  if (patch.refundAccessPolicy) update.refundAccessPolicy = patch.refundAccessPolicy;
  if (Array.isArray(patch.gateNames)) update.gateNames = patch.gateNames.filter(Boolean);
  if (typeof patch.waitlistEnabled === "boolean") update.waitlistEnabled = patch.waitlistEnabled;
  if (patch.registrationAssistant && typeof patch.registrationAssistant === "object") {
    for (const [key, value] of Object.entries(patch.registrationAssistant)) {
      update[`registrationAssistant.${key}`] = value;
    }
  }
  if (patch.notifications && typeof patch.notifications === "object") {
    const doc = await OrgSettings.findOne({ key: "default" }).lean();
    const existing = { ...DEFAULTS.notifications, ...(doc?.notifications || {}) };
    update.notifications = mergeNotifications(existing, patch.notifications);
  }

  if (patch.platform && typeof patch.platform === "object") {
    for (const [key, value] of Object.entries(patch.platform)) {
      if (key === "planLimits" && value && typeof value === "object") {
        for (const [limitKey, limitVal] of Object.entries(value)) {
          update[`platform.planLimits.${limitKey}`] = limitVal;
        }
      } else {
        update[`platform.${key}`] = value;
      }
    }
  }

  await OrgSettings.findOneAndUpdate(
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
