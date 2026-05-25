/**
 * Generate styled guide screenshots when live login credentials are unavailable.
 * Uses Playwright to render HTML mockups matching F-Zone UI style.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "screenshots");

const baseStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', sans-serif;
    background: #0b1220;
    color: #e2e8f0;
    min-height: 900px;
  }
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; border-bottom: 1px solid #1e293b;
    background: rgba(15,23,42,0.95);
  }
  .logo { font-weight: 700; color: #5eead4; }
  .nav-actions { display: flex; gap: 16px; color: #94a3b8; font-size: 14px; }
  .main { padding: 24px; }
  h1 { font-size: 24px; margin-bottom: 6px; }
  .sub { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .card {
    background: rgba(30,41,59,0.8);
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 16px;
  }
  .card-label { font-size: 12px; color: #94a3b8; }
  .card-value { font-size: 28px; font-weight: 700; margin-top: 8px; color: #f8fafc; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; background: #134e4a; color: #5eead4; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { border: 1px solid #334155; padding: 10px; text-align: left; }
  th { background: #1e293b; color: #94a3b8; }
  .btn { display: inline-block; padding: 8px 14px; border-radius: 8px; background: #0d9488; color: white; font-size: 13px; margin-right: 8px; }
  .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
  .watermark {
    position: fixed; bottom: 12px; right: 16px;
    font-size: 11px; color: #64748b;
  }
  .modal {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
  }
  .modal-box {
    width: 520px; background: #1e293b; border: 1px solid #475569;
    border-radius: 16px; padding: 20px;
  }
  .check { display: flex; gap: 8px; align-items: center; margin: 8px 0; font-size: 13px; }
  input[type=checkbox] { width: 16px; height: 16px; }
  .form-row { margin: 12px 0; }
  label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
  .input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; }
  .login-wrap {
    min-height: 900px; display: flex;
  }
  .login-left {
    flex: 1; padding: 48px; display: flex; flex-direction: column; justify-content: center;
    background: linear-gradient(135deg, #0f172a, #134e4a);
  }
  .login-right {
    width: 420px; padding: 48px 36px; background: #0b1220;
    border-left: 1px solid #1e293b;
  }
`;

const pages = {
  "02-overview.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div><div class="nav-actions"><span>🔔</span><span>Settings</span><span>Sign Out</span></div></div>
    <div class="main"><h1>Overview</h1><p class="sub">Platform dashboard — registrations, revenue & events</p>
    <div class="grid">
      <div class="card"><div class="card-label">Total Registrations</div><div class="card-value">1,248</div></div>
      <div class="card"><div class="card-label">Verified Check-ins</div><div class="card-value">892</div></div>
      <div class="card"><div class="card-label">Total Revenue</div><div class="card-value">₹4.2L</div></div>
      <div class="card"><div class="card-label">Entry Passes Issued</div><div class="card-value">1,102</div></div>
      <div class="card"><div class="card-label">Pending Entry</div><div class="card-value">210</div></div>
      <div class="card"><div class="card-label">Participant Database</div><div class="card-value">3,560</div></div>
    </div>
    <p class="sub" style="margin-top:20px">Running Events · Staff Tools · Recent Registrations</p></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "03-staff-settings.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div><div class="nav-actions">Settings</div></div>
    <div class="main"><h1>Settings</h1><p class="sub">Staff accounts — Super Admin only</p>
    <div class="card"><span class="badge">Super Admin</span>
    <table><tr><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
    <tr><td>admin@company.com</td><td>Admin</td><td><span class="badge">Pending</span></td><td><span class="btn">Activate</span></td></tr>
    <tr><td>scanner@company.com</td><td>Scanner</td><td><span class="badge">Active</span></td><td><span class="btn btn-outline">Disable</span></td></tr>
    </table></div></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "04-activate-permissions.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div><div class="main"><h1>Settings</h1></div>
    <div class="modal"><div class="modal-box"><h2 style="margin-bottom:12px">Activate admin</h2>
    <p class="sub">admin@company.com — select permissions</p>
    <div class="check"><input type="checkbox" checked> events:read — View events</div>
    <div class="check"><input type="checkbox" checked> events:write — Create events</div>
    <div class="check"><input type="checkbox"> investors:read — View investors</div>
    <div class="check"><input type="checkbox"> payments:read — Payment ledger</div>
    <div style="margin-top:16px"><span class="btn">Activate</span><span class="btn btn-outline">Cancel</span></div>
    </div></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "05-create-event.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>Create & Manage Events</h1><p class="sub">Event Studio</p>
    <div class="card"><div class="form-row"><label>Event name</label><div class="input">Annual Investor Meet 2026</div></div>
    <div class="form-row"><label>Schedule</label><div class="input">15 June 2026 · 10:00 AM</div></div>
    <div class="form-row"><label>Pricing</label><div class="input">Paid · ₹500 per investor</div></div>
    <span class="btn">Publish Event</span><span class="btn btn-outline">Copy public link</span></div></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "06-public-registration.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="main" style="max-width:520px;margin:40px auto"><h1>Event registration</h1>
    <p class="sub">Annual Investor Meet 2026</p>
    <div class="card"><div class="form-row"><label>Mobile Number</label><div class="input">9876543210</div></div>
    <span class="btn">Verify & Continue</span></div>
    <div class="card" style="margin-top:16px"><div class="card-label">Digital Entry Pass</div>
    <div class="card-value" style="font-size:18px">Investor · 2 Guests</div></div></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "07-user-management.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>User Management</h1><p class="sub">Participant Database</p>
    <span class="btn">Export All</span><span class="btn btn-outline">Data Studio</span>
    <table><tr><th>No</th><th>Code</th><th>Name</th><th>Phone</th><th>Gender</th></tr>
    <tr><td>1</td><td>INV001</td><td>Sample Investor</td><td>98*****210</td><td>Male</td></tr>
    <tr><td>2</td><td>INV002</td><td>Sample Investor 2</td><td>98*****211</td><td>Female</td></tr>
    </table></div>
    <div class="watermark">F-Zone Guide Screenshot · Sample data</div></body></html>`,

  "08-data-studio.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>Investor Data Studio</h1><p class="sub">Import wizard — Upload → Validate → Confirm</p>
    <div class="card"><span class="btn">Download template</span><span class="btn btn-outline">Import spreadsheet</span>
    <p class="sub" style="margin-top:12px">Required: No, Code_No, Name, Phone_No, Gender</p></div></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "09-all-registrations.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>All Registrations</h1>
    <table><tr><th>Event</th><th>Investor</th><th>Guests</th><th>Payment</th><th>Check-in</th></tr>
    <tr><td>Investor Meet</td><td>Sample A</td><td>2</td><td>Paid</td><td>✓</td></tr>
    </table></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "10-gate-scanner.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>Gate Check-in</h1><p class="sub">Secure QR Verification</p>
    <div class="form-row"><label>Gate</label><div class="input">Main Gate ▾</div></div>
    <div class="card" style="height:280px;display:flex;align-items:center;justify-content:center;color:#64748b">
    📷 Camera · Scan QR Code</div>
    <div class="card" style="margin-top:12px;border-color:#0d9488"><div class="card-label">Last scan</div>
    <div class="card-value" style="font-size:16px">✓ Check-in successful</div></div></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "11-payments.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>Payments & Revenue</h1>
    <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
    <div class="card"><div class="card-label">Collected</div><div class="card-value" style="font-size:20px">₹4.2L</div></div>
    <div class="card"><div class="card-label">Refunded</div><div class="card-value" style="font-size:20px">₹12K</div></div>
    </div>
    <table><tr><th>Date</th><th>Event</th><th>Amount</th><th>Status</th><th>Action</th></tr>
    <tr><td>12 May</td><td>Investor Meet</td><td>₹500</td><td>Paid</td><td><span class="btn btn-outline">Refund</span></td></tr>
    </table></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "12-settings-platform.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>Settings</h1>
    <div class="card"><h3 style="margin-bottom:8px">Refund access policy</h3>
    <div class="input">Block on pending + processed refunds</div>
    <div class="check" style="margin-top:12px"><input type="checkbox" checked> Enable waitlist</div></div>
    <div class="card" style="margin-top:12px"><h3>Gate names</h3><span class="badge">Main Gate</span> <span class="badge">VIP Gate</span></div>
    <span class="btn" style="margin-top:12px">Save platform settings</span></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,

  "13-audit-log.png": `<!DOCTYPE html><html><head><style>${baseStyle}</style></head><body>
    <div class="nav"><div class="logo">F-Zone</div></div>
    <div class="main"><h1>Audit Log</h1><p class="sub">Platform Security</p>
    <table><tr><th>Time</th><th>Actor</th><th>Action</th><th>Category</th></tr>
    <tr><td>12 May 10:30</td><td>fzone@gmail.com</td><td>investor.updated</td><td>investor</td></tr>
    <tr><td>12 May 09:15</td><td>admin@co.com</td><td>staff.activated</td><td>auth</td></tr>
    </table></div>
    <div class="watermark">F-Zone Guide Screenshot</div></body></html>`,
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [file, html] of Object.entries(pages)) {
    if (file === "01-login.png" && fs.existsSync(path.join(OUT, "01-login.png"))) continue;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, file) });
    console.log("Generated", file);
  }

  await browser.close();
}

main();
