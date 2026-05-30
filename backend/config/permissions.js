export const PERMISSION_CATALOG = [
  { key: "events:read", label: "View events & dashboard", group: "Events" },
  { key: "events:write", label: "Create, edit & delete events", group: "Events" },
  { key: "investors:read", label: "View investors", group: "Investors" },
  { key: "investors:write", label: "Edit & delete investors", group: "Investors" },
  { key: "investors:import", label: "Investor Data Studio import", group: "Investors" },
  { key: "registrations:read", label: "View registrations & attendance", group: "Registrations" },
  { key: "registrations:write", label: "Block guests & close registration", group: "Registrations" },
  { key: "payments:read", label: "View payment ledger", group: "Payments" },
  { key: "payments:refund", label: "Issue refunds", group: "Payments" },
  { key: "settings:write", label: "Edit platform settings", group: "Platform" },
  { key: "audit:read", label: "View audit log", group: "Platform" },
  { key: "platform:read", label: "View control center & server metrics", group: "Platform" },
  { key: "platform:write", label: "Manage maintenance, backups & server controls", group: "Platform" },
];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key);

export function isValidPermission(key) {
  return ALL_PERMISSION_KEYS.includes(key);
}

export function normalizePermissions(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((k) => isValidPermission(String(k))))];
}

export function getSuperAdminEmail() {
  return (process.env.SUPER_ADMIN_EMAIL || "fzone@gmail.com").trim().toLowerCase();
}
