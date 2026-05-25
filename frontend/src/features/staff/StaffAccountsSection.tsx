import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { Button, Input, PasswordInput, SelectPicker } from "rsuite";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { getApiErrorMessage } from "../../utils/apiError";

type StaffMember = {
  id: string;
  email: string;
  role: "admin" | "scanner" | "finance";
  createdAt: string | null;
};

const ROLE_OPTIONS = [
  { label: "Admin — full access", value: "admin" },
  { label: "Scanner — check-in & QR", value: "scanner" },
  { label: "Finance — payments & refunds", value: "finance" },
];

const PICKER_PROPS = {
  popupClassName: "pro-picker-menu",
  className: "pro-picker-toggle",
  searchable: false,
  cleanable: false,
} as const;

const ROLE_LABELS: Record<StaffMember["role"], string> = {
  admin: "Admin",
  scanner: "Scanner",
  finance: "Finance",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function StaffAccountsSection() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("admin");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/platform/staff");
      setStaff(res.data?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load staff accounts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setCreating(true);
    try {
      await API.post("/admin/platform/staff", {
        email: trimmedEmail,
        password,
        role,
      });
      toast.success("Staff account created");
      setEmail("");
      setPassword("");
      setRole("admin");
      await loadStaff();
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not create staff account");
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="app-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Users size={18} />
        <div>
          <h2 className="text-lg font-semibold text-app-text">Staff accounts</h2>
          <p className="text-sm text-app-muted mt-0.5">
            Create login credentials for team members. Share passwords securely.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-3 border border-app-border rounded-xl p-4 bg-app-surface-muted/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
          <UserPlus size={16} />
          Add staff member
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="staff@company.com"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Password</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-app-muted mb-1">Role</label>
          <SelectPicker
            {...PICKER_PROPS}
            data={ROLE_OPTIONS}
            value={role}
            onChange={(val) => setRole((val as StaffMember["role"]) || "admin")}
            block
          />
        </div>
        <Button
          appearance="primary"
          type="submit"
          loading={creating}
          disabled={creating}
          className="auth-shell__submit !w-auto !px-5"
        >
          {creating ? "Creating…" : "Create staff account"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-app-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-app-surface-muted/40 text-left text-app-muted">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-app-muted">
                  Loading staff…
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-app-muted">
                  No staff accounts yet
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id} className="border-b border-app-border last:border-0">
                  <td className="px-4 py-3 text-app-text">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className="guest-pay-badge guest-pay-badge--paid">
                      {ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-app-muted">{formatDate(member.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
