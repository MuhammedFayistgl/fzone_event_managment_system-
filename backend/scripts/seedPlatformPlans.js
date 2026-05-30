import { ensureSubscriptionPlansSeeded } from "../services/platformBillingService.js";

export async function seedPlatformPlans() {
  await ensureSubscriptionPlansSeeded();
  console.log("Platform subscription plans seeded");
}

if (process.argv[1]?.includes("seedPlatformPlans")) {
  import("../server/server.js")
    .then(({ ConnectionDB }) => ConnectionDB())
    .then(() => seedPlatformPlans())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
