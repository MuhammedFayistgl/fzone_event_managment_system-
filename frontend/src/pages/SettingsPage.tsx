import { useEffect, useState } from "react";
import { Check, Moon, Sun, Shield, Bell, Wallet, Webhook, ScrollText, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SelectPicker } from "rsuite";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AppPageLayout from "../layouts/AppPageLayout";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import { setTheme, type ThemeMode } from "../redux/store/slices/themeSlice";
import API from "../api/axios";
import StaffAccountsSection from "../features/staff/StaffAccountsSection";
import ClientGuideSection from "../features/client-guide/ClientGuideSection";
import { useAdminProfile } from "../hooks/useAdminProfile";
import { getRoleFromToken } from "../utils/authRole";

const themes: { id: ThemeMode; label: string; description: string; icon: typeof Sun }[] = [
  {
    id: "light",
    label: "Light",
    description: "Clean dashboard with white cards and soft gray backgrounds.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark — Premium Glass",
    description: "Refined glass surfaces with subtle cyan & fuchsia accents.",
    icon: Moon,
  },
];

function ThemePreview({ mode }: { mode: ThemeMode }) {
  if (mode === "dark") {
    return (
      <div className="relative h-24 rounded-xl mb-4 border border-app-border overflow-hidden bg-app-base">
        <div className="absolute inset-0 opacity-70 pointer-events-none">
          <div className="absolute top-0 left-0 w-20 h-20 bg-app-cyan/20 blur-2xl rounded-full" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-app-fuchsia/20 blur-2xl rounded-full" />
        </div>
        <div className="relative p-3 flex gap-2">
          <div className="flex-1 h-14 rounded-lg app-card-raised" />
          <div className="w-8 h-14 rounded-lg bg-app-cyan/20 border border-app-cyan/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-24 rounded-xl mb-4 border border-app-border overflow-hidden bg-app-base">
      <div className="p-3 flex gap-2">
        <div className="flex-1 h-14 rounded-lg bg-app-surface border border-app-border shadow-sm" />
        <div className="w-8 h-14 rounded-lg bg-blue-100 border border-blue-200" />
      </div>
    </div>
  );
}

type RegistrationAssistantSettings = {
  enabled: boolean;
  aiEnabled: boolean;
  welcomeMessageEn: string;
  welcomeMessageMl: string;
  supportPhone: string;
  supportEmail: string;
  dailyAiMessageCap: number;
};

type PlatformSettings = {
  refundAccessPolicy: "active_refunds" | "processed_only";
  gateNames: string[];
  waitlistEnabled: boolean;
  registrationAssistant: RegistrationAssistantSettings;
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpFrom: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioFromNumber: string;
  };
};

const REFUND_POLICY_OPTIONS = [
  { label: "Block on pending + processed refunds", value: "active_refunds" },
  { label: "Block only after refund is processed", value: "processed_only" },
];

const PICKER_PROPS = {
  popupClassName: "pro-picker-menu",
  className: "pro-picker-toggle",
  searchable: false,
  cleanable: false,
} as const;

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.theme.mode);
  const { isSuperAdmin, hasPermission, role } = useAdminProfile();
  const isAdminUser = role === "admin" || role === "super_admin";
  const canEditSettings = isSuperAdmin || hasPermission("settings:write");
  const canViewAudit = isSuperAdmin || hasPermission("audit:read");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [gateInput, setGateInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canEditSettings) return;
    API.get("/admin/platform/settings")
      .then((res) => setSettings(res.data?.data || null))
      .catch(() => toast.error("Could not load platform settings"));
  }, [canEditSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await API.patch("/admin/platform/settings", settings);
      setSettings(res.data?.data || settings);
      toast.success("Platform settings saved");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addGate = () => {
    const name = gateInput.trim();
    if (!name || !settings) return;
    if (settings.gateNames.includes(name)) return;
    setSettings({ ...settings, gateNames: [...settings.gateNames, name] });
    setGateInput("");
  };

  return (
    <AppPageLayout title="Settings" subtitle="Platform configuration and admin experience." embedded>
      <div className="max-w-4xl space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-app-text mb-1">Appearance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map((theme) => {
              const selected = current === theme.id;
              const Icon = theme.icon;
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => dispatch(setTheme(theme.id))}
                  className={`text-left rounded-2xl border p-5 transition-all ${
                    selected
                      ? "border-app-cyan bg-[var(--color-selected-bg)] ring-2 ring-app-cyan/30"
                      : "border-app-border bg-app-surface hover:bg-[var(--color-card-hover)]"
                  }`}
                >
                  <ThemePreview mode={theme.id} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center">
                        <Icon className="w-5 h-5 text-app-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-app-text">{theme.label}</p>
                        <p className="text-xs text-app-muted mt-1">{theme.description}</p>
                      </div>
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-app-cyan flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-app-base" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {isAdminUser && <ClientGuideSection />}

        {isSuperAdmin && <StaffAccountsSection />}

        {settings && canEditSettings && (
          <>
            <section className="app-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield size={18} />
                <h2 className="text-lg font-semibold">Refund access policy</h2>
              </div>
              <div className="max-w-md">
                <SelectPicker
                  {...PICKER_PROPS}
                  data={REFUND_POLICY_OPTIONS}
                  value={settings.refundAccessPolicy}
                  onChange={(val) =>
                    setSettings({
                      ...settings,
                      refundAccessPolicy:
                        (val as PlatformSettings["refundAccessPolicy"]) || "active_refunds",
                    })
                  }
                  block
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.waitlistEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, waitlistEnabled: e.target.checked })
                  }
                />
                Enable waitlist when event reaches max capacity
              </label>
            </section>

            <section className="app-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Bell size={18} />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          emailEnabled: e.target.checked,
                        },
                      })
                    }
                  />
                  Email notifications (SMTP)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          smsEnabled: e.target.checked,
                        },
                      })
                    }
                  />
                  SMS notifications (Twilio)
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="event-register-guests__select"
                  placeholder="SMTP host"
                  value={settings.notifications.smtpHost}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smtpHost: e.target.value },
                    })
                  }
                />
                <input
                  className="event-register-guests__select"
                  placeholder="SMTP from address"
                  value={settings.notifications.smtpFrom}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smtpFrom: e.target.value },
                    })
                  }
                />
              </div>
            </section>

            <section className="app-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} />
                <h2 className="text-lg font-semibold">Registration assistant</h2>
              </div>
              <p className="text-sm text-app-muted">
                Floating help chat on public event registration and portal pages. FAQ-first; optional AI when an API key is configured on the server.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.registrationAssistant?.enabled ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                Enable registration assistant on public pages
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.registrationAssistant?.aiEnabled ?? false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        aiEnabled: e.target.checked,
                      },
                    })
                  }
                />
                Allow AI fallback (requires GEMINI_API_KEY or OPENAI_API_KEY on server)
              </label>
              <div className="grid grid-cols-1 gap-3">
                <textarea
                  className="event-register-guests__select min-h-[72px]"
                  placeholder="Welcome message (English)"
                  value={settings.registrationAssistant?.welcomeMessageEn || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        welcomeMessageEn: e.target.value,
                      },
                    })
                  }
                />
                <textarea
                  className="event-register-guests__select min-h-[72px]"
                  placeholder="Welcome message (Malayalam)"
                  value={settings.registrationAssistant?.welcomeMessageMl || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        welcomeMessageMl: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="event-register-guests__select"
                  placeholder="Support phone"
                  value={settings.registrationAssistant?.supportPhone || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        supportPhone: e.target.value,
                      },
                    })
                  }
                />
                <input
                  className="event-register-guests__select"
                  placeholder="Support email"
                  value={settings.registrationAssistant?.supportEmail || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        supportEmail: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="max-w-xs">
                <label className="text-xs text-app-muted block mb-1">Daily AI message cap</label>
                <input
                  type="number"
                  min={0}
                  className="event-register-guests__select w-full"
                  value={settings.registrationAssistant?.dailyAiMessageCap ?? 200}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationAssistant: {
                        ...settings.registrationAssistant,
                        dailyAiMessageCap: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </section>

            <section className="app-card p-5 space-y-4">
              <h2 className="text-lg font-semibold">Gate names</h2>
              <div className="flex flex-wrap gap-2">
                {settings.gateNames.map((gate) => (
                  <span key={gate} className="guest-pay-badge guest-pay-badge--paid">
                    {gate}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  className="event-register-guests__select flex-1"
                  placeholder="Add gate name"
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                />
                <button type="button" className="reg-toolbar-btn" onClick={addGate}>
                  Add
                </button>
              </div>
            </section>

            <button
              type="button"
              className="payments-refund-submit"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save platform settings"}
            </button>
          </>
        )}

        <section className="app-card p-5 space-y-3">
          <h2 className="text-lg font-semibold">In-app notifications</h2>
          <p className="text-sm text-app-muted">
            Real-time alerts appear in the header bell and on the overview dashboard.
          </p>
          <Link to="/notifications" className="reg-toolbar-btn inline-flex w-fit">
            Open notification center
          </Link>
        </section>

        {canViewAudit && (
        <section className="app-card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Platform tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/platform/audit-log" className="app-card p-4 hover:bg-[var(--color-card-hover)] transition">
              <ScrollText size={18} className="mb-2 text-app-accent" />
              <p className="font-semibold">Audit log</p>
            </Link>
            <Link to="/platform/webhooks" className="app-card p-4 hover:bg-[var(--color-card-hover)] transition">
              <Webhook size={18} className="mb-2 text-app-accent" />
              <p className="font-semibold">Webhook deliveries</p>
            </Link>
            {(isSuperAdmin || getRoleFromToken() === "finance") && (
            <Link to="/finance/reconciliation" className="app-card p-4 hover:bg-[var(--color-card-hover)] transition">
              <Wallet size={18} className="mb-2 text-app-accent" />
              <p className="font-semibold">Finance reconciliation</p>
            </Link>
            )}
          </div>
        </section>
        )}
      </div>
    </AppPageLayout>
  );
}
