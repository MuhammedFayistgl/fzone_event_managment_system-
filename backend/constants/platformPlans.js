export const PLAN_TIERS = ["free", "basic", "pro", "enterprise"];

export const PLAN_TIER_DEFAULTS = {
  free: {
    label: "Free",
    storageBytes: 524_288_000,
    apiRequestsMonth: 50_000,
    maxAdmins: 3,
    bandwidthBytesMonth: 1_073_741_824,
    priceMonthlyInr: 0,
    priceYearlyInr: 0,
  },
  basic: {
    label: "Basic",
    storageBytes: 5_368_709_120,
    apiRequestsMonth: 200_000,
    maxAdmins: 10,
    bandwidthBytesMonth: 10_737_418_240,
    priceMonthlyInr: 999,
    priceYearlyInr: 9990,
  },
  pro: {
    label: "Pro",
    storageBytes: 10_737_418_240,
    apiRequestsMonth: 1_000_000,
    maxAdmins: 25,
    bandwidthBytesMonth: 53_687_091_200,
    priceMonthlyInr: 2999,
    priceYearlyInr: 29990,
  },
  enterprise: {
    label: "Enterprise",
    storageBytes: 53_687_091_200,
    apiRequestsMonth: 10_000_000,
    maxAdmins: 100,
    bandwidthBytesMonth: 536_870_912_000,
    priceMonthlyInr: 9999,
    priceYearlyInr: 99990,
  },
};

export const DEFAULT_PLATFORM_SETTINGS = {
  maintenanceMode: false,
  maintenanceMessage: "We are performing scheduled maintenance. Please check back shortly.",
  plan: "free",
  planStatus: "active",
  planExpiresAt: null,
  autoRenew: true,
  lastDeploymentAt: null,
  usageWarningSentAt: null,
};

export function getPlanLimits(plan = "free") {
  const tier = PLAN_TIER_DEFAULTS[plan] || PLAN_TIER_DEFAULTS.free;
  return {
    storageBytes: tier.storageBytes,
    apiRequestsMonth: tier.apiRequestsMonth,
    maxAdmins: tier.maxAdmins,
    bandwidthBytesMonth: tier.bandwidthBytesMonth,
  };
}
