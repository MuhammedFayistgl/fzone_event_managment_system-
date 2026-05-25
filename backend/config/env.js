/**
 * Startup environment validation — fail fast in production on unsafe config.
 */
export function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const required = ["MONGODB_SERVER_IP", "ACCESS_SECRET", "REFRESH_SECRET"];

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (isProd) {
    if (process.env.REQUIRE_ADMIN_AUTH === "false") {
      throw new Error("REQUIRE_ADMIN_AUTH=false is forbidden in production");
    }
    if (process.env.ALLOW_ADMIN_SIGNUP === "true") {
      console.warn("WARNING: ALLOW_ADMIN_SIGNUP=true in production — disable after initial setup");
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is required in production");
    }
    if (!process.env.CORS_ORIGINS?.trim()) {
      throw new Error("CORS_ORIGINS must be set in production");
    }
  }

  if (process.env.ACCESS_SECRET === process.env.REFRESH_SECRET) {
    console.warn("WARNING: ACCESS_SECRET and REFRESH_SECRET should differ");
  }
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function cookieOptions(maxAgeMs) {
  // Cross-origin SPA (e.g. Vercel frontend + Render API) requires SameSite=None.
  const sameSite = process.env.COOKIE_SAME_SITE?.toLowerCase() || (isProduction() ? "none" : "lax");
  return {
    httpOnly: true,
    secure: isProduction() || sameSite === "none",
    sameSite,
    maxAge: maxAgeMs,
  };
}
