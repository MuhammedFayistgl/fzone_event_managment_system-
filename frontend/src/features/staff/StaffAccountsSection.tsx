import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserPlus, ShieldCheck, Ban, Pencil } from "lucide-react";
import { Button, Input, Modal, PasswordInput, SelectPicker } from "rsuite";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { getApiErrorMessage } from "../../utils/apiError";

type StaffStatus = "pending" | "active" | "disabled";

type StaffMember = {
  id: string;
  email: string;
  role: "admin" | "scanner" | "finance";
  status: StaffStatus;
  permissions: string[];
  activatedAt: string | null;
  createdAt: string | null;
};

type PermissionItem = {
  key: string;
  label: string;
  group: string;
};

const ROLE_OPTIONS = [
  { label: "Admin — permission-based access", value: "admin" },
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

const STATUS_LABELS: Record<StaffStatus, string> = {
  pending: "Pending",
  active: "Active",
  disabled: "Disabled",
};

function statusBadgeClass(status: StaffStatus) {
  if (status === "active") return "guest-pay-badge guest-pay-badge--paid";
  if (status === "pending") return "guest-pay-badge guest-pay-badge--due";
  return "guest-pay-badge guest-pay-badge--blocked";
}

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
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("admin");

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permModalMode, setPermModalMode] = useState<"activate" | "edit">("activate");
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const groupedCatalog = useMemo(() => {
    const groups = new Map<string, PermissionItem[]>();
    for (const item of catalog) {
      const list = groups.get(item.group) || [];
      list.push(item);
      groups.set(item.group, list);
    }
    return [...groups.entries()];
  }, [catalog]);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, catalogRes] = await Promise.all([
        API.get("/admin/platform/staff"),
        API.get("/admin/platform/permissions/catalog"),
      ]);
      setStaff(staffRes.data?.data || []);
      setCatalog(catalogRes.data?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load staff accounts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const openPermModal = (member: StaffMember, mode: "activate" | "edit") => {
    setSelectedMember(member);
    setSelectedPerms(member.permissions || []);
    setPermModalMode(mode);
    setPermModalOpen(true);
  };

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const savePermissions = async () => {
    if (!selectedMember) return;
    setSavingPerms(true);
    try {
      if (permModalMode === "activate") {
        await API.patch(`/admin/platform/staff/${selectedMember.id}/activate`, {
          permissions: selectedPerms,
        });
        toast.success("Staff account activated");
      } else {
        await API.patch(`/admin/platform/staff/${selectedMember.id}/permissions`, {
          permissions: selectedPerms,
        });
        toast.success("Permissions updated");
      }
      setPermModalOpen(false);
      await loadStaff();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save permissions"));
    } finally {
      setSavingPerms(false);
    }
  };

  const disableMember = async (member: StaffMember) => {
    if (!window.confirm(`Disable ${member.email}? They will not be able to log in.`)) return;
    try {
      await API.patch(`/admin/platform/staff/${member.id}/disable`);
      toast.success("Staff account disabled");
      await loadStaff();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not disable account"));
    }
  };

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
      toast.success(
        role === "admin"
          ? "Staff account created — activate to grant permissions"
          : "Staff account created"
      );
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
            Super admin only. New admins start as pending until you assign permissions and activate.
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
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-app-muted">
                  Loading staff…
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-app-muted">
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
                  <td className="px-4 py-3">
                    <span className={statusBadgeClass(member.status)}>
                      {STATUS_LABELS[member.status] || member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-app-muted">{formatDate(member.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {member.role === "admin" && member.status === "pending" && (
                        <button
                          type="button"
                          className="reg-toolbar-btn text-xs inline-flex items-center gap-1"
                          onClick={() => openPermModal(member, "activate")}
                        >
                          <ShieldCheck size={14} />
                          Activate
                        </button>
                      )}
                      {member.role === "admin" && member.status === "active" && (
                        <button
                          type="button"
                          className="reg-toolbar-btn text-xs inline-flex items-center gap-1"
                          onClick={() => openPermModal(member, "edit")}
                        >
                          <Pencil size={14} />
                          Permissions
                        </button>
                      )}
                      {member.status !== "disabled" && (
                        <button
                          type="button"
                          className="reg-toolbar-btn text-xs inline-flex items-center gap-1 text-red-500"
                          onClick={() => disableMember(member)}
                        >
                          <Ban size={14} />
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={permModalOpen} onClose={() => setPermModalOpen(false)} size="md">
        <Modal.Header>
          <Modal.Title>
            {permModalMode === "activate" ? "Activate admin" : "Edit permissions"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMember && (
            <p className="text-sm text-app-muted mb-4">
              {selectedMember.email} — select what this admin can access.
            </p>
          )}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {groupedCatalog.map(([group, items]) => (
              <div key={group}>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted mb-2">
                  {group}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-2 text-sm cursor-pointer rounded-lg border border-app-border px-3 py-2 hover:bg-[var(--color-card-hover)]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(item.key)}
                        onChange={() => togglePerm(item.key)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-medium text-app-text">{item.label}</span>
                        <span className="text-xs text-app-muted">{item.key}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setPermModalOpen(false)} appearance="subtle">
            Cancel
          </Button>
          <Button appearance="primary" loading={savingPerms} onClick={savePermissions}>
            {permModalMode === "activate" ? "Activate" : "Save permissions"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
