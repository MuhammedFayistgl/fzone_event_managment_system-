/**
 * Capture guide screenshots from live Vercel app.
 * Set GUIDE_LOGIN_EMAIL and GUIDE_LOGIN_PASSWORD env vars (or backend/.env SEED_*).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "screenshots");

dotenv.config({ path: path.join(ROOT, "..", "..", "backend", ".env") });

const BASE = process.env.GUIDE_APP_URL || "https://fzone-event-managment-system.vercel.app";
const EMAIL = process.env.GUIDE_LOGIN_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || "fzone@gmail.com";
const PASSWORD = process.env.GUIDE_LOGIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "";

const shots = [
  { file: "01-login.png", path: "/login", auth: false },
  { file: "02-overview.png", path: "/", auth: true },
  { file: "03-staff-settings.png", path: "/settings", auth: true, scroll: 400 },
  { file: "05-create-event.png", path: "/event", auth: true },
  { file: "07-user-management.png", path: "/user-management", auth: true },
  { file: "08-data-studio.png", path: "/user-management/data-studio", auth: true },
  { file: "09-all-registrations.png", path: "/allregistrations", auth: true },
  { file: "10-gate-scanner.png", path: "/gate-scanner", auth: true },
  { file: "11-payments.png", path: "/payments", auth: true },
  { file: "12-settings-platform.png", path: "/settings", auth: true, scroll: 600 },
  { file: "13-audit-log.png", path: "/platform/audit-log", auth: true },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1500);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  if (await emailInput.count()) {
    await emailInput.fill(EMAIL);
    await passInput.fill(PASSWORD);
    await page.locator('button:has-text("Sign in"), button[type="submit"]').first().click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 });
    await page.waitForTimeout(2500);
  }
}

async function capturePublicRegistration(page) {
  try {
    const res = await page.request.get(`${BASE.replace("vercel.app", "onrender.com")}/admin/createdevents`.replace(
      "fzone-event-managment-system.onrender.com",
      "fzone-api.onrender.com"
    ));
  } catch {
    /* fallback below */
  }

  const apiBase = "https://fzone-api.onrender.com";
  let eventId = null;
  if (PASSWORD) {
    try {
      const loginRes = await page.request.post(`${apiBase}/admin/login`, {
        data: { email: EMAIL, password: PASSWORD },
      });
      const loginJson = await loginRes.json();
      const token = loginJson.accessToken;
      if (token) {
        const eventsRes = await page.request.get(`${apiBase}/admin/createdevents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventsJson = await eventsRes.json();
        const events = eventsJson?.data || eventsJson?.events || [];
        if (Array.isArray(events) && events.length > 0) {
          eventId = events[0]._id || events[0].id;
        }
      }
    } catch (err) {
      console.warn("Could not fetch event for public registration screenshot:", err.message);
    }
  }

  const regPath = eventId ? `/event/${eventId}` : "/login";
  await page.goto(`${BASE}${regPath}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, "06-public-registration.png"), fullPage: false });
  console.log("Saved 06-public-registration.png");
}

async function captureActivateModal(page) {
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);
  const activateBtn = page.locator('button:has-text("Activate")').first();
  if (await activateBtn.count()) {
    await activateBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, "04-activate-permissions.png"), fullPage: false });
    console.log("Saved 04-activate-permissions.png");
    await page.keyboard.press("Escape");
  } else {
    await page.screenshot({ path: path.join(OUT, "04-activate-permissions.png"), fullPage: false });
    console.log("Saved 04-activate-permissions.png (staff section — no pending admin to activate)");
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const shot of shots) {
    if (shot.auth && !PASSWORD) {
      console.warn(`Skipping ${shot.file} — set GUIDE_LOGIN_PASSWORD or SEED_ADMIN_PASSWORD`);
      continue;
    }
    try {
      if (shot.auth) {
        if (!page.url().includes(BASE) || page.url().includes("/login")) {
          await login(page);
        }
        await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle", timeout: 90000 });
      } else {
        await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle", timeout: 90000 });
      }
      await page.waitForTimeout(2000);
      if (shot.scroll) await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
      await page.screenshot({ path: path.join(OUT, shot.file), fullPage: false });
      console.log(`Saved ${shot.file}`);
    } catch (err) {
      console.warn(`Failed ${shot.file}:`, err.message);
    }
  }

  if (PASSWORD) {
    if (!page.url().includes(BASE) || page.url().includes("/login")) await login(page);
    await captureActivateModal(page);
    await capturePublicRegistration(page);
  } else {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, "06-public-registration.png") });
    console.log("Saved 06-public-registration.png (login placeholder — set password for event page)");
  }

  await browser.close();
  console.log("Screenshot capture done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
